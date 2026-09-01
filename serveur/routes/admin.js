// Administration : connexion serveur, journal des clics et reservations.
import { Router } from 'express';
import { join } from 'node:path';
import { verifierIdentifiants, creerJetonAdmin, DUREE_SESSION_ADMIN_SECONDES } from '../services/authentification.js';
import { protegerAdmin, estAdministrateur, NOM_DU_COOKIE_ADMIN } from '../middlewares/protection-admin.js';
import { deposerCookie, supprimerCookie } from '../utilitaires/cookies.js';
import { recupererLeJournal } from '../services/journal.js';
import { recupererLesReservations } from '../services/reservations.js';
import { recupererLesLieuxProposes, supprimerUnLieuPropose } from '../services/lieux-proposes.js';
import { effacerLeDessin, recupererLeDessin } from '../services/dessin.js';
import { nettoyerTexte } from '../utilitaires/validation.js';
import { creerCompteurDeTentatives } from '../middlewares/tentatives.js';
import { resumerLesExperiences } from '../services/resume-des-experiences.js';
import { dossierPublic } from '../chemins.js';
import { attraper } from '../utilitaires/asynchrone.js';

export const routesAdmin = Router();

const MAXIMUM_DE_TENTATIVES = 8;
const FENETRE_DE_TENTATIVES = 10 * 60 * 1000;

const tentatives = creerCompteurDeTentatives({
  maximum: MAXIMUM_DE_TENTATIVES,
  fenetreEnMillisecondes: FENETRE_DE_TENTATIVES,
});

routesAdmin.get('/', (requete, reponse) => {
  reponse.sendFile(join(dossierPublic, 'admin.html'));
});

routesAdmin.get('/api/etat', (requete, reponse) => {
  reponse.json({ authentifie: estAdministrateur(requete) });
});

routesAdmin.post('/api/connexion', (requete, reponse) => {
  const adresse = requete.ip ?? 'inconnue';
  if (tentatives.tropDeTentatives(adresse)) {
    return reponse.status(429).json({ erreur: 'Trop de tentatives, reessayez plus tard.' });
  }
  const identifiant = nettoyerTexte(requete.body?.identifiant, 60);
  const motDePasse = typeof requete.body?.motDePasse === 'string' ? requete.body.motDePasse : '';
  if (!verifierIdentifiants(identifiant, motDePasse)) {
    tentatives.compter(adresse);
    return reponse.status(401).json({ erreur: 'Identifiants incorrects.' });
  }
  tentatives.reinitialiser(adresse);
  deposerCookie(reponse, NOM_DU_COOKIE_ADMIN, creerJetonAdmin(), DUREE_SESSION_ADMIN_SECONDES);
  return reponse.json({ message: 'Connexion reussie.' });
});

routesAdmin.post('/api/deconnexion', (requete, reponse) => {
  supprimerCookie(reponse, NOM_DU_COOKIE_ADMIN);
  reponse.json({ message: 'Deconnexion effectuee.' });
});

routesAdmin.get('/api/journal', protegerAdmin, attraper(async (requete, reponse) => {
  reponse.json({ journalDesClics: await recupererLeJournal() });
}));

routesAdmin.get('/api/reservations', protegerAdmin, attraper(async (requete, reponse) => {
  reponse.json({ reservations: await recupererLesReservations() });
}));

routesAdmin.get('/api/lieux-proposes', protegerAdmin, attraper(async (requete, reponse) => {
  reponse.json({ lieuxProposes: await recupererLesLieuxProposes() });
}));

// Retrait d'un point de la carte, reserve a l'administration.
routesAdmin.delete('/api/lieux-proposes/:identifiant', protegerAdmin, attraper(async (requete, reponse) => {
  const identifiant = nettoyerTexte(requete.params.identifiant, 60);
  const retire = await supprimerUnLieuPropose(identifiant);
  if (!retire) return reponse.status(404).json({ erreur: 'Ce point n’existe plus.' });
  return reponse.json({ message: 'Point retiré de la carte.' });
}));

// Experiences creees depuis la page /create, resumees pour le suivi.
routesAdmin.get('/api/experiences', protegerAdmin, attraper(async (requete, reponse) => {
  reponse.json({ experiences: await resumerLesExperiences() });
}));

routesAdmin.get('/api/dessin', protegerAdmin, attraper(async (requete, reponse) => {
  const traits = await recupererLeDessin();
  reponse.json({ nombreDeTraits: traits.length });
}));

// Effacement complet du coloriage partage.
routesAdmin.delete('/api/dessin', protegerAdmin, attraper(async (requete, reponse) => {
  await effacerLeDessin();
  reponse.json({ message: 'Coloriage effacé.' });
}));
