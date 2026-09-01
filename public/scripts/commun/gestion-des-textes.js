// Couche de textes et fenêtre d'édition réunies : créer, modifier, déplacer et
// supprimer une zone de texte passent tous par ici.
import { creerLaCoucheDeTextes } from './textes.js';
import { ouvrirLEditionDuTexte } from './edition-texte.js';

export const creerLaGestionDesTextes = (couche, auChangement) => {
  const traiter = ({ action, texte }) => {
    if (action === 'supprimer') return coucheDeTextes.retirer(texte);
    if (action === 'enregistrer') return coucheDeTextes.rafraichir(texte);
    // Un texte tout juste créé puis abandonné ne doit pas rester vide sur la carte.
    if (texte.contenu.length === 0) coucheDeTextes.retirer(texte);
    return undefined;
  };

  const coucheDeTextes = creerLaCoucheDeTextes(couche, {
    auTexteChoisi: (texte) => ouvrirLEditionDuTexte(texte, traiter),
    auChangement,
  });

  return {
    ...coucheDeTextes,
    // Un nouveau texte s'ouvre aussitôt à la saisie : sans contenu, il n'existe pas.
    ajouterEtEditer: (texte) => {
      coucheDeTextes.ajouter(texte);
      ouvrirLEditionDuTexte(texte, traiter);
    },
  };
};
