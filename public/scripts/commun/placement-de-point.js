// Placement manuel d'un point sur la carte d'une experience.
// Aucun lieu n'est jamais place automatiquement : c'est toujours un appui de
// l'utilisateur qui decide, a la souris comme au doigt.
import { redresserDesMetres } from '../carte/projection.js';

let placementActif = false;
let auPointPlace = null;
let elements = null;

export const placementEnCours = () => placementActif;

export const arreterLePlacement = () => {
  placementActif = false;
  auPointPlace = null;
  if (elements) elements.bandeau.hidden = true;
};

export const demarrerLePlacement = (rappel, intitule) => {
  if (!elements) return;
  placementActif = true;
  auPointPlace = rappel;
  elements.intitule.textContent = intitule;
  elements.bandeau.hidden = false;
};

// Renvoie la position en metres bruts, independante de l'orientation de l'ecran
// et de la taille de la fenetre : le point suit la carte, pas les pixels.
const positionEnMetres = (scene, projection, evenement) => {
  const zone = scene.getBoundingClientRect();
  const vue = projection.versMetriqueDepuisEcran(
    evenement.clientX - zone.left,
    evenement.clientY - zone.top,
  );
  const brut = redresserDesMetres(vue.x, vue.y);
  return { x: Math.round(brut.x), y: Math.round(brut.y) };
};

export const brancherLePlacement = ({ scene, bandeau, intitule, boutonAnnuler, laProjection }) => {
  elements = { bandeau, intitule };

  // pointerdown couvre la souris et le tactile avec le meme code.
  scene.addEventListener('pointerdown', (evenement) => {
    if (!placementActif) return;
    const projection = laProjection();
    if (!projection) return;
    const rappel = auPointPlace;
    const point = positionEnMetres(scene, projection, evenement);
    arreterLePlacement();
    rappel?.(point);
  });

  boutonAnnuler.addEventListener('click', arreterLePlacement);
  document.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Escape' && placementActif) arreterLePlacement();
  });
};
