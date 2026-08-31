// Modeles d'appartements et d'immeubles : les silhouettes hautes de la ville.
import { entre } from './hasard.js';

export const MODELES_D_IMMEUBLES = [
  {
    nom: 'petitImmeuble',
    categorie: 'immeuble',
    poids: 2,
    creer: (a) => ({
      largeur: entre(a, 24, 32),
      profondeur: entre(a, 18, 24),
      hauteur: entre(a, 28, 38),
      toit: { type: 'plat', hauteur: 0 },
    }),
  },
  {
    nom: 'immeubleAncien',
    categorie: 'immeuble',
    poids: 2,
    creer: (a) => ({
      largeur: entre(a, 20, 28),
      profondeur: entre(a, 16, 22),
      hauteur: entre(a, 32, 42),
      toit: { type: 'pignon', hauteur: entre(a, 6, 8) },
    }),
  },
  {
    nom: 'barreDImmeuble',
    categorie: 'immeuble',
    poids: 1,
    creer: (a) => ({
      largeur: entre(a, 44, 58),
      profondeur: entre(a, 18, 24),
      hauteur: entre(a, 40, 55),
      toit: { type: 'plat', hauteur: 0 },
    }),
  },
  {
    nom: 'tourDHabitation',
    categorie: 'immeuble',
    poids: 1,
    creer: (a) => ({
      largeur: entre(a, 18, 24),
      profondeur: entre(a, 16, 22),
      hauteur: entre(a, 55, 75),
      toit: { type: 'plat', hauteur: 0 },
    }),
  },
];
