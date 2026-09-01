// Lieux de l'experience vus par l'invite : il les consulte, et peut en ajouter
// tant que la limite globale de cinq n'est pas atteinte.
// Un lieu ajoute est place a la main, jamais automatiquement.
import { etat, surChangement, definirLesLieux, LIEUX_MAXIMAUX } from './etat.js';
import { ajouterDesLieux, modifierLesHoraires } from './api.js';
import { creerUneFicheDeLieu } from '../commun/fiche-de-lieu.js';
import { ouvrirLaRecherche } from '../commun/recherche-de-lieux.js';
import { ouvrirLEditionDesHoraires } from '../commun/edition-horaires.js';
import { demarrerLePlacement } from '../commun/placement-de-point.js';

export const brancherLesLieux = () => {
  const liste = document.getElementById('listeDesLieux');
  const bouton = document.getElementById('boutonAjouterUnLieu');
  const compteur = document.getElementById('compteurDesLieux');
  const message = document.getElementById('messageDesLieux');

  const enregistrer = async (lieu) => {
    message.textContent = 'Enregistrement…';
    try {
      definirLesLieux(await ajouterDesLieux([lieu]));
      message.textContent = '';
    } catch (erreur) {
      message.textContent = erreur.message;
    }
  };

  // Le lieu n'est envoye qu'une fois son point pose sur la carte.
  const placerPuisEnregistrer = (lieu) =>
    demarrerLePlacement(
      (point) => enregistrer({ ...lieu, point }),
      `Touche la carte à l’endroit de « ${lieu.nom} »`,
    );

  // Les horaires corriges sont enregistres : ils deviennent ceux de l'experience.
  const corrigerLesHoraires = (lieu) =>
    ouvrirLEditionDesHoraires(lieu, async (horaires) => {
      message.textContent = 'Enregistrement des horaires…';
      try {
        definirLesLieux(await modifierLesHoraires(lieu.identifiant, horaires));
        message.textContent = '';
      } catch (erreur) {
        message.textContent = erreur.message;
      }
    });

  const rafraichir = () => {
    const lieux = etat.experience?.lieux ?? [];
    liste.replaceChildren(
      ...lieux.map((lieu) => creerUneFicheDeLieu(lieu, { auxHoraires: () => corrigerLesHoraires(lieu) })),
    );
    compteur.textContent = `${lieux.length} / ${LIEUX_MAXIMAUX}`;
    bouton.disabled = lieux.length >= LIEUX_MAXIMAUX;
  };

  bouton.addEventListener('click', () => {
    const cleDeLaVille = etat.experience?.ville?.cle;
    if (!cleDeLaVille) return;
    ouvrirLaRecherche(cleDeLaVille, placerPuisEnregistrer);
  });

  surChangement(rafraichir);
};
