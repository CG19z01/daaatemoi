// Mode "placer un point" : le prochain appui sur la carte devient la position proposee.
// Pendant ce mode, le feutre est suspendu pour ne pas dessiner par accident.
let placementActif = false;
let auPointPlace = null;

const bandeau = () => document.getElementById('bandeauDePlacement');

export const placementEnCours = () => placementActif;

export const arreterLePlacement = () => {
  placementActif = false;
  auPointPlace = null;
  bandeau().hidden = true;
};

export const demarrerLePlacement = (rappel) => {
  placementActif = true;
  auPointPlace = rappel;
  bandeau().hidden = false;
};

export const brancherLePlacement = (scene, obtenirLaProjection) => {
  scene.addEventListener('pointerdown', (evenement) => {
    if (!placementActif) return;
    const zone = scene.getBoundingClientRect();
    const coordonnees = obtenirLaProjection().versCoordonneesDepuisEcran(
      evenement.clientX - zone.left,
      evenement.clientY - zone.top,
    );
    const rappel = auPointPlace;
    arreterLePlacement();
    rappel?.(coordonnees);
  });

  document.getElementById('annulerLePlacement').addEventListener('click', arreterLePlacement);
  document.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Escape' && placementActif) arreterLePlacement();
  });
};
