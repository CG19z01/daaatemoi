// Coloriage d'une experience : les traits sont conserves cote serveur, en
// metres, pour etre rejoues a l'identique sur n'importe quel appareil.
// Chaque experience a sa propre collection.
import { entrepot } from './entrepot.js';

const TRAITS_MAXIMAUX = 400;

export const nomDuDessinDUneExperience = (slug) => `dessin-${slug}`;

export const ajouterUnTrait = async (trait, nomDeLaCollection) => {
  const dessin = await entrepot.lireCollection(nomDeLaCollection);
  // Au-dela de la limite, les plus anciens traits laissent la place.
  const conserves = [...dessin, trait].slice(-TRAITS_MAXIMAUX);
  if (conserves.length === dessin.length + 1) {
    await entrepot.ajouterDansCollection(nomDeLaCollection, trait);
  } else {
    await entrepot.remplacerLaCollection(nomDeLaCollection, conserves);
  }
  return trait;
};

export const recupererLeDessin = (nomDeLaCollection) =>
  entrepot.lireCollection(nomDeLaCollection);
