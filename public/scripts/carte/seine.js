// La Seine, dessinee a partir du trace reel d'OpenStreetMap (bras de l'ile Lacroix compris).
import { NOIR, BLANC } from './trait.js';

const tracerLaBande = (contexte, points, epaisseur, couleur) => {
  contexte.beginPath();
  points.forEach((point, index) => {
    if (index === 0) contexte.moveTo(point.x, point.y);
    else contexte.lineTo(point.x, point.y);
  });
  contexte.globalAlpha = 1;
  contexte.lineCap = 'round';
  contexte.lineJoin = 'round';
  contexte.lineWidth = epaisseur;
  contexte.strokeStyle = couleur;
  contexte.stroke();
};

// Deux passages : toutes les rives noires, puis toute l'eau blanche par-dessus,
// pour que les bras se rejoignent proprement.
export const dessinerLaSeine = (contexte, riviere, projection) => {
  const epaisseurDuTrait = Math.max(1.4, projection.echelle * 3);
  const bras = riviere.map((cours) => ({
    points: cours.points.map(([x, y]) => projection.versEcranMetrique(x, y, 0)),
    largeur: Math.max(4, cours.largeur * projection.echelle),
  }));
  for (const cours of bras) {
    tracerLaBande(contexte, cours.points, cours.largeur + epaisseurDuTrait * 2, NOIR);
  }
  for (const cours of bras) {
    tracerLaBande(contexte, cours.points, cours.largeur, BLANC);
  }
};
