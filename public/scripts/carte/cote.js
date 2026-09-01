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

// Étendue d'eau que borde un trait de côte : le tracé, puis le même tracé
// repoussé au large et parcouru en sens inverse. Le polygone ainsi fermé
// couvre toute la mer visible, du rivage jusqu'au bord de la carte.
export const polygoneVersLEau = (points, profondeur) => [
  ...points,
  ...decalerVersLEau(points, profondeur).reverse(),
];

// Test « ce point est-il au large ? », prêt à être appelé des milliers de fois.
// Chaque étendue garde sa boîte englobante : la plupart des points sont écartés
// par une simple comparaison, sans parcourir le contour.
export const creerTestDeLaMer = (littoral, profondeur) => {
  const etendues = littoral.map((trace) => {
    const contour = polygoneVersLEau(trace, profondeur);
    const abscisses = contour.map(([x]) => x);
    const ordonnees = contour.map(([, y]) => y);
    return {
      contour,
      minimumX: Math.min(...abscisses),
      maximumX: Math.max(...abscisses),
      minimumY: Math.min(...ordonnees),
      maximumY: Math.max(...ordonnees),
    };
  });

  return (x, y, estDansLePolygone) =>
    etendues.some(
      (etendue) =>
        x >= etendue.minimumX &&
        x <= etendue.maximumX &&
        y >= etendue.minimumY &&
        y <= etendue.maximumY &&
        estDansLePolygone(x, y, etendue.contour),
    );
};
