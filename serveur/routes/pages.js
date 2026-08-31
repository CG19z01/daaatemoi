// Pages publiques : chaque visiteur recoit simplement une identite.
import { Router } from 'express';
import { join } from 'node:path';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { dossierPublic } from '../chemins.js';

export const routesPages = Router();

const envoyerPage = (nomDuFichier) => (requete, reponse) =>
  reponse.sendFile(join(dossierPublic, nomDuFichier));

routesPages.get('/', identifierLeVisiteur, envoyerPage('index.html'));
routesPages.get('/carte', identifierLeVisiteur, envoyerPage('carte.html'));
