// Coloriage partage : les traits sont conserves cote serveur, en metres,
// pour etre rejoues a l'identique sur n'importe quel appareil.
import { entrepot } from './entrepot.js';

const NOM_DU_DESSIN = 'dessin';
const TRAITS_MAXIMAUX = 400;

export const ajouterUnTrait = async (trait) => {
  const dessin = await entrepot.lireCollection(NOM_DU_DESSIN);
  // Au-dela de la limite, les plus anciens traits laissent la place.
  const conserves = [...dessin, trait].slice(-TRAITS_MAXIMAUX);
  if (conserves.length === dessin.length + 1) {
    await entrepot.ajouterDansCollection(NOM_DU_DESSIN, trait);
  } else {
    await entrepot.remplacerLaCollection(NOM_DU_DESSIN, conserves);
  }
  return trait;
};

export const recupererLeDessin = () => entrepot.lireCollection(NOM_DU_DESSIN);

export const effacerLeDessin = () => entrepot.remplacerLaCollection(NOM_DU_DESSIN, []);
