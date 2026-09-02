// Grille d'occupation : marque le fleuve, les voies et les parcs pour qu'aucun
// batiment ne soit place dessus. Une case vaut 1 des qu'elle est prise.
// Vrai si le point tombe a l'interieur du contour. Sert aussi bien a la grille
// qu'au decor, pour ecarter tout ce qui se trouve sur l'eau.
export const estDansLePolygone = (x, y, points) => {
  let dedans = false;
  for (let a = 0, b = points.length - 1; a < points.length; b = a, a += 1) {
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const traverse = ay > y !== by > y;
    if (traverse && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) dedans = !dedans;
  }
  return dedans;
};

export const creerGrilleDOccupation = (limite, pas) => {
  const cotes = Math.ceil((limite * 2) / pas) + 1;
  const cases = new Uint8Array(cotes * cotes);

  const indice = (x, y) => {
    const colonne = Math.floor((x + limite) / pas);
    const ligne = Math.floor((y + limite) / pas);
    if (colonne < 0 || ligne < 0 || colonne >= cotes || ligne >= cotes) return -1;
    return ligne * cotes + colonne;
  };

  const marquerUnDisque = (x, y, rayon) => {
    for (let ecartX = -rayon; ecartX <= rayon; ecartX += pas) {
      for (let ecartY = -rayon; ecartY <= rayon; ecartY += pas) {
        if (Math.hypot(ecartX, ecartY) > rayon) continue;
        const position = indice(x + ecartX, y + ecartY);
        if (position >= 0) cases[position] = 1;
      }
    }
  };

  // Une ligne est parcourue pas a pas, en marquant un disque a chaque etape.
  const marquerUneLigne = (points, rayon) => {
    for (let numero = 1; numero < points.length; numero += 1) {
      const [departX, departY] = points[numero - 1];
      const [arriveeX, arriveeY] = points[numero];
      const longueur = Math.hypot(arriveeX - departX, arriveeY - departY);
      const etapes = Math.max(1, Math.ceil(longueur / pas));
      for (let etape = 0; etape <= etapes; etape += 1) {
        const avancement = etape / etapes;
        marquerUnDisque(
          departX + (arriveeX - departX) * avancement,
          departY + (arriveeY - departY) * avancement,
          rayon,
        );
      }
    }
  };

  // Un parc est marque en entier, contour compris.
  const marquerUnPolygone = (points) => {
    const abscisses = points.map(([x]) => x);
    const ordonnees = points.map(([, y]) => y);
    for (let x = Math.min(...abscisses); x <= Math.max(...abscisses); x += pas) {
      for (let y = Math.min(...ordonnees); y <= Math.max(...ordonnees); y += pas) {
        if (!estDansLePolygone(x, y, points)) continue;
        const position = indice(x, y);
        if (position >= 0) cases[position] = 1;
      }
    }
  };

  // Vrai seulement si toute l'emprise du batiment est libre.
  const emplacementLibre = (x, y, largeur, profondeur) => {
    for (let ecartX = 0; ecartX <= largeur; ecartX += pas) {
      for (let ecartY = 0; ecartY <= profondeur; ecartY += pas) {
        const position = indice(x + ecartX, y + ecartY);
        if (position < 0 || cases[position] === 1) return false;
      }
    }
    return true;
  };

  return { marquerUneLigne, marquerUnPolygone, emplacementLibre };
};
