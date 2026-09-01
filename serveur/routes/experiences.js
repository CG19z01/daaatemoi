// Acces d'un invite a une experience : mot de passe, lecture, puis reponse.
// Le message d'erreur est toujours le meme, que le lien n'existe pas ou que le
// mot de passe soit faux : rien ne permet de deviner les adresses existantes.
import { Router } from 'express';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { creerCompteurDeTentatives } from '../middlewares/tentatives.js';
import { protegerLExperience, adresseDeLExperience } from '../middlewares/acces-experience.js';
import { deposerCookie } from '../utilitaires/cookies.js';
import { attraper } from '../utilitaires/asynchrone.js';
import { verifierLeMotDePasse } from '../utilitaires/mot-de-passe.js';
import { validerLaReponse } from '../utilitaires/validation-reponse.js';
import { validerLesLieux, LIEUX_MAXIMAUX_PAR_EXPERIENCE } from '../utilitaires/validation-lieux.js';
import { nettoyerLesHoraires } from '../utilitaires/validation-horaires.js';
import { nettoyerTexte } from '../utilitaires/validation.js';
import {
  recupererUneExperience,
  enregistrerLaReponse,
  ajouterDesLieux,
  modifierUnLieu,
  sansSecret,
} from '../services/experiences.js';
import {
  creerJetonDAcces,
  NOM_DU_COOKIE_INVITE,
  DUREE_DE_L_ACCES_EN_SECONDES,
} from '../services/acces-invite.js';
import { prevenirDUneReponse } from '../services/notification.js';

export const routesExperiences = Router();

routesExperiences.use(identifierLeVisiteur);

const MESSAGE_GENERIQUE = 'Lien ou mot de passe incorrect.';
const TENTATIVES_MAXIMALES = 8;
const FENETRE_DE_TENTATIVES = 15 * 60 * 1000;
const RALENTISSEMENT_PAR_TENTATIVE = 250;
const RALENTISSEMENT_MAXIMAL = 2000;
// Empreinte inerte : verifier un lien inexistant coute alors le meme temps
// qu'un vrai, ce qui empeche de deviner les adresses par chronometrage.
const EMPREINTE_LEURRE = 'scrypt$32768$8$1$epC4fKBOiAOA44v29AhbTQ$4FdVIJndJYRAlSwe_qO8upxU3u0JX20Aq4vdUKs7Y7w';

const tentatives = creerCompteurDeTentatives({
  maximum: TENTATIVES_MAXIMALES,
  fenetreEnMillisecondes: FENETRE_DE_TENTATIVES,
});

const attendre = (duree) => new Promise((terminer) => setTimeout(terminer, duree));

// Chaque echec ralentit un peu plus la reponse suivante.
const ralentir = (nombreDEchecs) =>
  attendre(Math.min(nombreDEchecs * RALENTISSEMENT_PAR_TENTATIVE, RALENTISSEMENT_MAXIMAL));

routesExperiences.post('/:slug/connexion', attraper(async (requete, reponse) => {
  const slug = adresseDeLExperience(requete);
  const cle = `${requete.ip ?? 'inconnue'}|${slug ?? 'inconnu'}`;
  if (tentatives.tropDeTentatives(cle)) {
    return reponse.status(429).json({ erreur: 'Trop d’essais. Réessaie plus tard.' });
  }
  const motDePasse = typeof requete.body?.motDePasse === 'string' ? requete.body.motDePasse : '';
  const experience = slug ? await recupererUneExperience(slug) : null;
  const correct = await verifierLeMotDePasse(
    motDePasse,
    experience?.empreinteDuMotDePasse ?? EMPREINTE_LEURRE,
  );

  if (!experience || !correct) {
    await ralentir(tentatives.compter(cle));
    return reponse.status(401).json({ erreur: MESSAGE_GENERIQUE });
  }

  tentatives.reinitialiser(cle);
  deposerCookie(reponse, NOM_DU_COOKIE_INVITE, creerJetonDAcces(slug), DUREE_DE_L_ACCES_EN_SECONDES);
  return reponse.json({ message: 'Bienvenue !' });
}));

routesExperiences.get('/:slug', protegerLExperience, attraper(async (requete, reponse) => {
  const experience = await recupererUneExperience(requete.adresseDeLExperience);
  if (!experience) return reponse.status(404).json({ erreur: 'Expérience introuvable.' });
  return reponse.json({ experience: sansSecret(experience) });
}));

routesExperiences.post('/:slug/reponse', protegerLExperience, attraper(async (requete, reponse) => {
  const experience = await recupererUneExperience(requete.adresseDeLExperience);
  if (!experience) return reponse.status(404).json({ erreur: 'Expérience introuvable.' });

  const { erreur, reponse: reponseValidee } = validerLaReponse(requete.body, experience);
  if (erreur) return reponse.status(400).json({ erreur });

  const misAJour = await enregistrerLaReponse(experience.slug, reponseValidee);
  // La notification part apres l'enregistrement, et son echec ne le remet pas en cause.
  await prevenirDUneReponse(misAJour, misAJour.reponse);
  return reponse.status(201).json({ message: 'C’est envoyé !', reponse: misAJour.reponse });
}));

routesExperiences.post('/:slug/lieux', protegerLExperience, attraper(async (requete, reponse) => {
  const experience = await recupererUneExperience(requete.adresseDeLExperience);
  if (!experience) return reponse.status(404).json({ erreur: 'Expérience introuvable.' });
  if (experience.lieux.length >= LIEUX_MAXIMAUX_PAR_EXPERIENCE) {
    return reponse.status(400).json({ erreur: `Cette expérience a déjà ${LIEUX_MAXIMAUX_PAR_EXPERIENCE} lieux.` });
  }

  const { erreur, lieux } = validerLesLieux(requete.body?.lieux, 'invite', experience.lieux.length);
  if (erreur) return reponse.status(400).json({ erreur });
  if (lieux.length === 0) return reponse.status(400).json({ erreur: 'Aucun lieu à ajouter.' });

  const misAJour = await ajouterDesLieux(experience.slug, lieux);
  return reponse.status(201).json({ lieux: misAJour.lieux });
}));

// Correction des horaires d'un lieu par l'invite : ils deviennent ceux de
// l'experience, et le createur les retrouve donc tels quels.
routesExperiences.patch('/:slug/lieux/:identifiant', protegerLExperience, attraper(async (requete, reponse) => {
  const identifiant = nettoyerTexte(requete.params.identifiant, 40);
  const horaires = nettoyerLesHoraires(requete.body?.horaires);
  const misAJour = await modifierUnLieu(requete.adresseDeLExperience, identifiant, { horaires });
  if (!misAJour) return reponse.status(404).json({ erreur: 'Ce lieu n’existe plus.' });
  return reponse.json({ lieux: misAJour.lieux });
}));
