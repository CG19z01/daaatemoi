// Creation d'une experience : choix de la ville, recherche de lieux reels,
// puis enregistrement. Toutes les donnees sensibles sont validees ici, et le
// mot de passe est hache avant la moindre ecriture.
import { Router } from 'express';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { envoiAutorise, envoiAutoriseParAdresse } from '../middlewares/limitation.js';
import { attraper } from '../utilitaires/asynchrone.js';
import { nettoyerTexte } from '../utilitaires/validation.js';
import { enCle } from '../utilitaires/cle.js';
import { adressePublique } from '../utilitaires/adresse-publique.js';
import { validerUneExperience } from '../utilitaires/validation-experience.js';
import { preparerLaVille, recupererUneVille, recupererLeFondDeVille } from '../services/carte-de-ville.js';
import {
  rechercherDesLieux,
  nettoyerLeTermeRecherche,
  LONGUEUR_MINIMALE_DE_LA_RECHERCHE,
} from '../services/recherche-de-lieux.js';
import { creerUneExperience } from '../services/experiences.js';
import { composerLeLien } from '../services/slug.js';

export const routesCreation = Router();

routesCreation.use(identifierLeVisiteur);

// Extraire une ville coute cher : le quota est volontairement serre.
// Deux compteurs pour chaque appel couteux : un par visiteur, et un par adresse
// que le fait de vider ses cookies ne remet pas a zero.
const VILLES_MAXIMALES = 10;
const VILLES_MAXIMALES_PAR_ADRESSE = 30;
const RECHERCHES_MAXIMALES = 60;
const RECHERCHES_MAXIMALES_PAR_ADRESSE = 200;
const CREATIONS_MAXIMALES = 6;
const CREATIONS_MAXIMALES_PAR_ADRESSE = 40;

const trop = (requete, parVisiteur, parAdresse, nom) =>
  !envoiAutorise(requete, parVisiteur, nom) ||
  !envoiAutoriseParAdresse(requete, parAdresse, nom);

routesCreation.post('/ville', attraper(async (requete, reponse) => {
  if (trop(requete, VILLES_MAXIMALES, VILLES_MAXIMALES_PAR_ADRESSE, 'villes')) {
    return reponse.status(429).json({ erreur: 'Trop de villes demandées. Réessaie dans quelques minutes.' });
  }
  const nomDemande = nettoyerTexte(requete.body?.ville, 80);
  if (!nomDemande) return reponse.status(400).json({ erreur: 'Veuillez indiquer une ville.' });

  try {
    const { erreur, ville } = await preparerLaVille(nomDemande);
    if (erreur) return reponse.status(404).json({ erreur });
    return reponse.json({ ville });
  } catch (probleme) {
    console.error(`Preparation de ville impossible : ${probleme.message}`);
    return reponse.status(503).json({
      erreur: 'La carte de cette ville n’a pas pu être générée. Réessaie dans un instant.',
    });
  }
}));

// Fond de carte d'une ville deja preparee : donnees publiques OpenStreetMap.
routesCreation.get('/carte/:cle', attraper(async (requete, reponse) => {
  const fond = await recupererLeFondDeVille(enCle(requete.params.cle));
  if (!fond) return reponse.status(404).json({ erreur: 'Carte introuvable.' });
  return reponse.json({ fond });
}));

routesCreation.get('/lieux', attraper(async (requete, reponse) => {
  if (trop(requete, RECHERCHES_MAXIMALES, RECHERCHES_MAXIMALES_PAR_ADRESSE, 'recherches')) {
    return reponse.status(429).json({ erreur: 'Trop de recherches. Réessaie dans quelques minutes.' });
  }
  const ville = await recupererUneVille(enCle(nettoyerTexte(requete.query?.ville, 60)));
  if (!ville) return reponse.status(400).json({ erreur: 'Choisis d’abord une ville.' });

  const terme = nettoyerLeTermeRecherche(requete.query?.recherche);
  if (terme.length < LONGUEUR_MINIMALE_DE_LA_RECHERCHE) {
    return reponse.status(400).json({ erreur: 'Cherche avec au moins deux lettres.' });
  }
  try {
    return reponse.json({ lieux: await rechercherDesLieux(terme, ville) });
  } catch (probleme) {
    console.error(`Recherche de lieux impossible : ${probleme.message}`);
    return reponse.status(503).json({ erreur: 'La recherche est indisponible. Réessaie dans un instant.' });
  }
}));

routesCreation.post('/experiences', attraper(async (requete, reponse) => {
  if (trop(requete, CREATIONS_MAXIMALES, CREATIONS_MAXIMALES_PAR_ADRESSE, 'creations')) {
    return reponse.status(429).json({ erreur: 'Trop de créations. Réessaie dans quelques minutes.' });
  }
  const { erreur, experience, motDePasse } = validerUneExperience(requete.body);
  if (erreur) return reponse.status(400).json({ erreur });

  // La ville est relue cote serveur : ses coordonnees ne viennent jamais du navigateur.
  const ville = await recupererUneVille(experience.villeCle);
  if (!ville) return reponse.status(400).json({ erreur: 'Choisis d’abord une ville.' });

  const creee = await creerUneExperience(experience, ville, motDePasse);
  const lien = `${adressePublique(requete)}${composerLeLien(creee.slug)}`;
  return reponse.status(201).json({ slug: creee.slug, lien });
}));
