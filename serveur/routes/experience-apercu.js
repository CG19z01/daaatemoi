// Aperçu public d'une expérience : uniquement sa ville, pour que la carte
// s'affiche derrière la demande de mot de passe.
//
// Rien d'autre ne sort d'ici : ni les lieux, ni les dates, ni les dessins, ni
// bien sûr l'empreinte du mot de passe. Savoir dans quelle ville se passe un
// rendez-vous ne dit rien de ce rendez-vous, et l'accès au contenu reste
// entièrement protégé par le mot de passe, vérifié côté serveur.
import { Router } from 'express';
import { envoiAutoriseParAdresse } from '../middlewares/limitation.js';
import { adresseDeLExperience } from '../middlewares/acces-experience.js';
import { attraper } from '../utilitaires/asynchrone.js';
import { recupererUneExperience } from '../services/experiences.js';

export const routesApercuDExperience = Router();

// Quota par adresse : de quoi ouvrir des liens normalement, pas de quoi
// parcourir les adresses possibles à la recherche de celles qui existent.
const APERCUS_MAXIMAUX = 40;

routesApercuDExperience.get('/:slug/ville', attraper(async (requete, reponse) => {
  if (!envoiAutoriseParAdresse(requete, APERCUS_MAXIMAUX, 'apercus')) {
    return reponse.status(429).json({ erreur: 'Trop de demandes. Réessaie plus tard.' });
  }
  const slug = adresseDeLExperience(requete);
  const experience = slug ? await recupererUneExperience(slug) : null;
  if (!experience) return reponse.status(404).json({ erreur: 'Lien inconnu.' });
  return reponse.json({ ville: experience.ville });
}));
