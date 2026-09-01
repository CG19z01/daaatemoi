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

// Découpe le littoral en segments élémentaires, une seule fois.
const enSegments = (littoral) => {
  const segments = [];
  for (const trace of littoral) {
    for (let rang = 1; rang < trace.length; rang += 1) {
      const [ax, ay] = trace[rang - 1];
      const [bx, by] = trace[rang];
      segments.push({ ax, ay, ecartX: bx - ax, ecartY: by - ay });
    }
  }
  return segments;
};

// Distance d'un point à un segment, et côté sur lequel il se trouve.
const examiner = (segment, x, y) => {
  const { ax, ay, ecartX, ecartY } = segment;
  const longueurCarree = ecartX * ecartX + ecartY * ecartY;
  const avancement =
    longueurCarree === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - ax) * ecartX + (y - ay) * ecartY) / longueurCarree));
  const distance = Math.hypot(x - (ax + avancement * ecartX), y - (ay + avancement * ecartY));
  // Produit vectoriel négatif : le point est à droite du sens du tracé, donc
  // du côté de l'eau.
  return { distance, aLEau: ecartX * (y - ay) - ecartY * (x - ax) < 0 };
};

// Renvoie une fonction (x, y) -> { aLEau, distance }.
//
// On cherche le segment de côte le plus proche, puis on regarde de quel côté
// on se trouve. Fermer la mer en un polygone paraissait plus simple, mais un
// littoral découpé en vingt morceaux produisait des contours qui se
// recouvraient et s'annulaient : toute une ville pouvait alors passer pour de
// l'eau. Le segment le plus proche, lui, ne se contredit jamais.
export const creerTestDeLaMer = (littoral) => {
  const segments = enSegments(littoral);
  if (segments.length === 0) return () => ({ aLEau: false, distance: Infinity });

  return (x, y) => {
    let resultat = { aLEau: false, distance: Infinity };
    for (const segment of segments) {
      const examen = examiner(segment, x, y);
      if (examen.distance < resultat.distance) resultat = examen;
    }
    return resultat;
  };
};
