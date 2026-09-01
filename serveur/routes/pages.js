// Pages publiques : chaque visiteur recoit simplement une identite.
import { Router } from 'express';
import { join } from 'node:path';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { extraireLeSlug } from '../services/slug.js';
import { dossierPublic } from '../chemins.js';

export const routesPages = Router();

const envoyerPage = (nomDuFichier) => (requete, reponse) =>
  reponse.sendFile(join(dossierPublic, nomDuFichier));

routesPages.get('/', identifierLeVisiteur, envoyerPage('index.html'));
routesPages.get('/carte', identifierLeVisiteur, envoyerPage('carte.html'));
routesPages.get('/create', identifierLeVisiteur, envoyerPage('creation.html'));

// Page invitee : seules les adresses de la forme "trois-mots-romantiques-for-you"
// sont servies. Tout autre chemin poursuit sa route vers le 404.
routesPages.get('/:adresse', identifierLeVisiteur, (requete, reponse, suite) => {
  if (!extraireLeSlug(requete.params.adresse)) return suite();
  return reponse.sendFile(join(dossierPublic, 'invite.html'));
});
