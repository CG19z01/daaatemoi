// Côté eau d'un trait de côte.
//
// Convention OpenStreetMap : en suivant le sens du tracé, la terre est à
// gauche et l'eau à droite. C'est ce qui permet de savoir de quel côté dessiner
// l'écume, et de quel côté ne surtout pas poser de bâtiments.
//
// Les coordonnées sont en mètres, x vers l'est et y vers le nord : la normale
// à droite du sens de marche vaut donc (dy, -dx).
export const decalerVersLEau = (points, distance) =>
  points.map((point, rang) => {
    const precedent = points[Math.max(0, rang - 1)];
    const suivant = points[Math.min(points.length - 1, rang + 1)];
    const ecartX = suivant[0] - precedent[0];
    const ecartY = suivant[1] - precedent[1];
    const longueur = Math.hypot(ecartX, ecartY) || 1;
    return [
      point[0] + (ecartY / longueur) * distance,
      point[1] - (ecartX / longueur) * distance,
    ];
  });
