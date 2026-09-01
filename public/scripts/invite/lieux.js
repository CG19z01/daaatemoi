// Lieux de l'experience vus par l'invite : il les consulte, et peut en ajouter
// tant que la limite globale de cinq n'est pas atteinte.
// Un lieu ajoute est place a la main, jamais automatiquement.
import { etat, surChangement, definirLesLieux, LIEUX_MAXIMAUX } from './etat.js';
import { ajouterDesLieux, modifierUnLieu } from './api.js';
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

  // Toute correction d'un lieu passe par le serveur : le créateur la retrouve.
  const corriger = async (lieu, modifications, intitule) => {
    message.textContent = intitule;
    try {
      definirLesLieux(await modifierUnLieu(lieu.identifiant, modifications));
      message.textContent = '';
    } catch (erreur) {
      message.textContent = erreur.message;
    }
  };

  const corrigerLesHoraires = (lieu) =>
    ouvrirLEditionDesHoraires(lieu, (horaires) =>
      corriger(lieu, { horaires }, 'Enregistrement des horaires…'),
    );

  const rafraichir = () => {
    const lieux = etat.experience?.lieux ?? [];
    liste.replaceChildren(
      ...lieux.map((lieu) =>
        creerUneFicheDeLieu(lieu, {
          auxHoraires: () => corrigerLesHoraires(lieu),
          auCouleurModifiee: (couleur) =>
            corriger(lieu, { couleur }, 'Enregistrement de la couleur…'),
        }),
      ),
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
