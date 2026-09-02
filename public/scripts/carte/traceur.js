// Tracé d'un trait sur la couche de coloriage.
//
// Les traits sont retenus en mètres : ils se rejouent depuis leurs coordonnées,
// donc nets à n'importe quelle échelle et sur n'importe quel écran.
import { MODE_GOMME, MODE_REMPLISSAGE } from './reglages-du-feutre.js';

const preparerLOutil = (contexte, trait, echelle) => {
  contexte.globalAlpha = 1;
  contexte.globalCompositeOperation =
    trait.mode === MODE_GOMME ? 'destination-out' : 'source-over';
  contexte.strokeStyle = trait.couleur;
  contexte.lineWidth = Math.max(1, trait.tailleEnMetres * echelle);
  contexte.lineCap = 'round';
  contexte.lineJoin = 'round';
};

// Un remplissage n'est pas un tracé : il est confié à la scène, seule à
// connaître les pixels de la carte sur lesquels retrouver la zone.
export const tracerUnTrait = (contexte, trait, projection, auRemplissage) => {
  if (!projection || trait.points.length === 0) return;
  if (trait.mode === MODE_REMPLISSAGE) {
    auRemplissage?.(trait);
    return;
  }
  preparerLOutil(contexte, trait, projection.echelle);
  contexte.beginPath();
  trait.points.forEach(([x, y], rang) => {
    const position = projection.versEcranMetrique(x, y, 0);
    if (rang === 0) contexte.moveTo(position.x, position.y);
    else contexte.lineTo(position.x, position.y);
  });
  contexte.stroke();
};
