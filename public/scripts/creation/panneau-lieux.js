// Panneau des lieux du createur : recherche, ajout, placement manuel du point,
// correction des horaires et suppression avant publication.
import {
  etat,
  surChangement,
  ajouterUnLieu,
  modifierUnLieu,
  retirerUnLieu,
  LIEUX_MAXIMAUX,
} from './etat.js';
import { creerUneFicheDeLieu } from '../commun/fiche-de-lieu.js';
import { ouvrirLaRecherche } from '../commun/recherche-de-lieux.js';
import { ouvrirLEditionDesHoraires } from '../commun/edition-horaires.js';
import { demarrerLePlacement } from '../commun/placement-de-point.js';

export const brancherLePanneauDesLieux = () => {
  const liste = document.getElementById('listeDesLieux');
  const bouton = document.getElementById('boutonAjouterUnLieu');
  const compteur = document.getElementById('compteurDesLieux');

  // Un lieu n'est jamais place tout seul : c'est toujours un appui sur la carte.
  const placer = (lieu) =>
    demarrerLePlacement(
      (point) => modifierUnLieu(lieu.cle, { point }),
      `Touche la carte à l’endroit de « ${lieu.nom} »`,
    );

  const rafraichir = () => {
    liste.replaceChildren(
      ...etat.lieux.map((lieu) =>
        creerUneFicheDeLieu(lieu, {
          auNomModifie: (modifications) => modifierUnLieu(lieu.cle, modifications),
          auPlacement: () => placer(lieu),
          auxHoraires: () =>
            ouvrirLEditionDesHoraires(lieu, (horaires) => modifierUnLieu(lieu.cle, { horaires })),
          auRetrait: () => retirerUnLieu(lieu.cle),
        }),
      ),
    );
    compteur.textContent = `${etat.lieux.length} / ${LIEUX_MAXIMAUX}`;
    bouton.disabled = etat.lieux.length >= LIEUX_MAXIMAUX || !etat.ville;
  };

  bouton.addEventListener('click', () => {
    if (!etat.ville) return;
    ouvrirLaRecherche(etat.ville.cle, (trouve) => {
      const ajoute = ajouterUnLieu({ ...trouve, point: null });
      // On enchaine directement sur le placement : c'est l'etape suivante attendue.
      if (ajoute) placer(ajoute);
    });
  });

  surChangement(rafraichir);
  rafraichir();
};
