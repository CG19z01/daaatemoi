// Pendant la création, l'expérience n'existe pas encore : le dessin et les
// textes sont donc gardés en mémoire, puis déposés d'un bloc juste après la
// publication, quand l'adresse est enfin connue.
import { decouper } from '../carte/dessin-partage.js';
import { deposerUnTrait, deposerLesTextes } from './api.js';

export const creerLeDepotDuDessin = (atelier) => {
  const traitsEnAttente = [];
  atelier.scene.coloration.surTraitTermine((trait) => traitsEnAttente.push(trait));

  // Ne lève jamais : une expérience créée ne doit pas être remise en cause
  // parce que son décor n'a pas pu partir. L'appelant en est informé.
  const deposer = async (slug) => {
    try {
      for (const trait of traitsEnAttente) {
        for (const morceau of decouper(trait)) await deposerUnTrait(slug, morceau);
      }
      const textes = atelier.textes.liste();
      if (textes.length > 0) await deposerLesTextes(slug, textes);
      return true;
    } catch {
      return false;
    }
  };

  return { deposer, aQuelqueChose: () => traitsEnAttente.length > 0 || atelier.textes.liste().length > 0 };
};
