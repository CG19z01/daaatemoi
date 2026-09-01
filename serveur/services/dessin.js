// Coloriage partage : les traits sont conserves cote serveur, en metres,
// pour etre rejoues a l'identique sur n'importe quel appareil.
// La carte historique de Rouen et chaque experience ont leur propre collection.
import { entrepot } from './entrepot.js';

const NOM_DU_DESSIN = 'dessin';
const TRAITS_MAXIMAUX = 400;

export const nomDuDessinDUneExperience = (slug) => `dessin-${slug}`;

export const ajouterUnTrait = async (trait, nomDeLaCollection = NOM_DU_DESSIN) => {
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

export const recupererLeDessin = (nomDeLaCollection = NOM_DU_DESSIN) =>
  entrepot.lireCollection(nomDeLaCollection);

export const effacerLeDessin = (nomDeLaCollection = NOM_DU_DESSIN) =>
  entrepot.remplacerLaCollection(nomDeLaCollection, []);
