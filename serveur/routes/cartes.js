// Service des cartes (menus) des lieux : seuls les fichiers declares sont accessibles.
// Le dossier donnees/ contient aussi le journal : il n'est jamais expose en entier.
import { Router } from 'express';
import { join } from 'node:path';
import { cartesDisponibles } from '../donnees/lieux.js';
import { dossierRacine } from '../chemins.js';

const DOSSIER_DES_CARTES = join(dossierRacine, 'donnees');

export const routesCartes = Router();

routesCartes.get('/:nomDuFichier', (requete, reponse) => {
  const nomDuFichier = requete.params.nomDuFichier;
  if (!cartesDisponibles().has(nomDuFichier)) {
    return reponse.status(404).json({ erreur: 'Carte introuvable.' });
  }
  return reponse.sendFile(join(DOSSIER_DES_CARTES, nomDuFichier));
});
