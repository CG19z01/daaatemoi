// Modeles de maisons : des silhouettes simples, sans fenetre.
import { entre } from './hasard.js';

export const MODELES_DE_MAISONS = [
  {
    nom: 'petiteMaison',
    categorie: 'maison',
    poids: 3,
    creer: (a) => ({
      largeur: entre(a, 18, 26),
      profondeur: entre(a, 14, 20),
      hauteur: entre(a, 12, 18),
      toit: { type: 'pignon', hauteur: entre(a, 7, 11) },
    }),
  },
  {
    nom: 'maisonHauteEtEtroite',
    categorie: 'maison',
    poids: 3,
    creer: (a) => ({
      largeur: entre(a, 12, 18),
      profondeur: entre(a, 14, 20),
      hauteur: entre(a, 22, 32),
      toit: { type: 'pignon', hauteur: entre(a, 6, 9) },
    }),
  },
  {
    nom: 'maisonLarge',
    categorie: 'maison',
    poids: 2,
    creer: (a) => ({
      largeur: entre(a, 30, 44),
      profondeur: entre(a, 18, 26),
      hauteur: entre(a, 14, 20),
      toit: { type: 'pignon', hauteur: entre(a, 8, 12) },
    }),
  },
  {
    nom: 'maisonAToitPlat',
    categorie: 'maison',
    poids: 2,
    creer: (a) => ({
      largeur: entre(a, 22, 30),
      profondeur: entre(a, 18, 24),
      hauteur: entre(a, 16, 24),
      toit: { type: 'plat', hauteur: 0 },
    }),
  },
  {
    nom: 'maisonAncienneAsymetrique',
    categorie: 'maison',
    poids: 2,
    creer: (a) => ({
      largeur: entre(a, 20, 28),
      profondeur: entre(a, 16, 22),
      hauteur: entre(a, 14, 22),
      toit: { type: 'monopente', hauteur: entre(a, 7, 11) },
    }),
  },
  {
    nom: 'maisonDeVilleMitoyenne',
    categorie: 'maison',
    poids: 3,
    creer: (a) => ({
      largeur: entre(a, 14, 20),
      profondeur: entre(a, 16, 22),
      hauteur: entre(a, 18, 26),
      toit: { type: 'pignon', hauteur: entre(a, 5, 8) },
    }),
  },
  {
    nom: 'atelierBasEtLarge',
    categorie: 'maison',
    poids: 2,
    creer: (a) => ({
      largeur: entre(a, 28, 40),
      profondeur: entre(a, 16, 22),
      hauteur: entre(a, 10, 15),
      toit: { type: 'monopente', hauteur: entre(a, 6, 9) },
    }),
  },
];
