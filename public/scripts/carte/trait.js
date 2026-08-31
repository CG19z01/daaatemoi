// Primitives de dessin : uniquement du noir sur du blanc, des contours francs.
export const NOIR = '#000000';
export const BLANC = '#ffffff';

const suivreLesPoints = (contexte, points) => {
  contexte.beginPath();
  points.forEach((point, index) => {
    if (index === 0) contexte.moveTo(point.x, point.y);
    else contexte.lineTo(point.x, point.y);
  });
};

// Surface blanche cernee d'un trait noir net, sans transparence ni degrade.
export const tracerForme = (contexte, points, epaisseurDuTrait) => {
  suivreLesPoints(contexte, points);
  contexte.closePath();
  contexte.globalAlpha = 1;
  contexte.fillStyle = BLANC;
  contexte.fill();
  contexte.lineWidth = epaisseurDuTrait;
  contexte.strokeStyle = NOIR;
  contexte.lineJoin = 'miter';
  contexte.stroke();
};
