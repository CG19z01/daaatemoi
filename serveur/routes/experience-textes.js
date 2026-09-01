// Zones de texte d'une expérience : lecture et enregistrement.
// L'accès est protégé par le même cookie signé que le reste de l'expérience.
import { Router } from 'express';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { protegerLExperience } from '../middlewares/acces-experience.js';
import { attraper } from '../utilitaires/asynchrone.js';
import { validerLesTextes } from '../utilitaires/validation-textes.js';
import { recupererLesTextes, remplacerLesTextes } from '../services/textes.js';

export const routesTextesDExperience = Router();

routesTextesDExperience.use(identifierLeVisiteur);

routesTextesDExperience.get('/:slug/textes', protegerLExperience, attraper(async (requete, reponse) => {
  reponse.json({ textes: await recupererLesTextes(requete.adresseDeLExperience) });
}));

// La liste entière est remplacée d'un coup : le navigateur envoie l'état final
// après une action terminée, jamais à chaque déplacement de la souris.
routesTextesDExperience.put('/:slug/textes', protegerLExperience, attraper(async (requete, reponse) => {
  const { erreur, textes } = validerLesTextes(requete.body?.textes);
  if (erreur) return reponse.status(400).json({ erreur });
  await remplacerLesTextes(requete.adresseDeLExperience, textes);
  return reponse.json({ textes });
}));
