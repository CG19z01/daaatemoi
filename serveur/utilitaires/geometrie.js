// Conversion des coordonnees geographiques en metres relatifs au centre d'une
// ville, et simplification des traces. Le navigateur recoit ainsi un fond de
// carte leger, deja dans le repere qu'utilise la projection de la carte.
const METRES_PAR_DEGRE_LATITUDE = 110574;
const METRES_PAR_DEGRE_LONGITUDE_A_L_EQUATEUR = 111320;

// Meme formule que la projection cote navigateur : les deux reperes coincident.
export const creerConvertisseurEnMetres = (centre) => {
  const metresParDegreLongitude =
    METRES_PAR_DEGRE_LONGITUDE_A_L_EQUATEUR * Math.cos((centre.latitude * Math.PI) / 180);
  return ({ lat, lon }) => [
    Math.round((lon - centre.longitude) * metresParDegreLongitude),
    Math.round((lat - centre.latitude) * METRES_PAR_DEGRE_LATITUDE),
  ];
};

const distanceAuSegment = ([x, y], [debutX, debutY], [finX, finY]) => {
  const longueurX = finX - debutX;
  const longueurY = finY - debutY;
  const longueurCarree = longueurX * longueurX + longueurY * longueurY;
  if (longueurCarree === 0) return Math.hypot(x - debutX, y - debutY);
  const avancement = Math.max(
    0,
    Math.min(1, ((x - debutX) * longueurX + (y - debutY) * longueurY) / longueurCarree),
  );
  return Math.hypot(x - (debutX + avancement * longueurX), y - (debutY + avancement * longueurY));
};

// Douglas-Peucker, parcouru avec une pile plutot qu'en recursion : un trace
// tres long ne peut pas faire deborder la pile d'appels.
export const simplifierUnTrace = (points, tolerance) => {
  if (points.length <= 2) return points;
  const conserves = new Uint8Array(points.length);
  conserves[0] = 1;
  conserves[points.length - 1] = 1;
  const aTraiter = [[0, points.length - 1]];

  while (aTraiter.length > 0) {
    const [debut, fin] = aTraiter.pop();
    let ecartMaximal = 0;
    let indiceLePlusEloigne = -1;
    for (let indice = debut + 1; indice < fin; indice += 1) {
      const ecart = distanceAuSegment(points[indice], points[debut], points[fin]);
      if (ecart > ecartMaximal) {
        ecartMaximal = ecart;
        indiceLePlusEloigne = indice;
      }
    }
    if (ecartMaximal <= tolerance || indiceLePlusEloigne === -1) continue;
    conserves[indiceLePlusEloigne] = 1;
    aTraiter.push([debut, indiceLePlusEloigne], [indiceLePlusEloigne, fin]);
  }
  return points.filter((point, indice) => conserves[indice] === 1);
};

// Retire les points repetes, que la simplification laisserait passer.
export const retirerLesDoublons = (points) =>
  points.filter((point, indice) => {
    if (indice === 0) return true;
    const precedent = points[indice - 1];
    return point[0] !== precedent[0] || point[1] !== precedent[1];
  });

// Overpass renvoie les voies entieres des qu'elles touchent la zone demandee :
// un fleuve peut ainsi s'etendre sur des dizaines de kilometres. Le trace est
// donc coupe en morceaux, en gardant le point de sortie pour atteindre le bord.
export const decouperDansLaZone = (points, limite) => {
  const morceaux = [];
  let morceauEnCours = [];
  for (const point of points) {
    if (Math.abs(point[0]) <= limite && Math.abs(point[1]) <= limite) {
      morceauEnCours.push(point);
      continue;
    }
    if (morceauEnCours.length > 0) {
      morceauEnCours.push(point);
      morceaux.push(morceauEnCours);
      morceauEnCours = [];
    }
  }
  if (morceauEnCours.length > 0) morceaux.push(morceauEnCours);
  return morceaux.filter((morceau) => morceau.length >= 2);
};

// Vrai si le trace est entierement hors de la zone (cas des parcs voisins).
export const horsDeLaZone = (points, limite) =>
  points.every(([x, y]) => Math.abs(x) > limite || Math.abs(y) > limite);
