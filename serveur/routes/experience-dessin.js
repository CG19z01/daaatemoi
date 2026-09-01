// Coloriage propre a une experience : chaque adresse a sa propre collection de
// traits, l'invite ne voit donc que le dessin de sa carte.
import { Router } from 'express';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { protegerLExperience } from '../middlewares/acces-experience.js';
import { attraper } from '../utilitaires/asynchrone.js';
import { validerUnTrait } from '../utilitaires/validation-traits.js';
import { ajouterUnTrait, recupererLeDessin, nomDuDessinDUneExperience } from '../services/dessin.js';

export const routesDessinDExperience = Router();

routesDessinDExperience.use(identifierLeVisiteur);

routesDessinDExperience.get('/:slug/dessin', protegerLExperience, attraper(async (requete, reponse) => {
  const traits = await recupererLeDessin(nomDuDessinDUneExperience(requete.adresseDeLExperience));
  reponse.json({ traits });
}));

routesDessinDExperience.post('/:slug/dessin', protegerLExperience, attraper(async (requete, reponse) => {
  const { erreur, trait } = validerUnTrait(requete.body);
  if (erreur) return reponse.status(400).json({ erreur });
  await ajouterUnTrait(trait, nomDuDessinDUneExperience(requete.adresseDeLExperience));
  return reponse.status(201).json({ message: 'Trait enregistré.' });
}));
