// Zones de texte posées sur la carte d'une expérience. Une collection par
// expérience, comme pour le coloriage : les textes d'une carte ne se mélangent
// jamais avec ceux d'une autre.
import { entrepot } from './entrepot.js';

const nomDesTextes = (slug) => `textes-${slug}`;

export const recupererLesTextes = (slug) => entrepot.lireCollection(nomDesTextes(slug));

// La liste complète remplace la précédente : créer, déplacer, modifier et
// supprimer passent tous par ce seul chemin, ce qui évite les états bancals.
export const remplacerLesTextes = (slug, textes) =>
  entrepot.remplacerLaCollection(nomDesTextes(slug), textes);
