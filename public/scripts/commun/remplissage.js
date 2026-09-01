// Outil Coloriage : un appui remplit la zone claire qui entoure le point visé,
// en s'arrêtant sur les traits noirs de la carte. Rien n'est déduit des données
// de la ville : on lit les pixels réellement dessinés, donc le remplissage suit
// exactement les contours visibles.
//
// Le résultat est peint sur la couche de coloriage, jamais sur la carte : le
// fond original reste intact, et la gomme efface le remplissage comme un trait.
const SEUIL_DU_CONTOUR = 130;
// Garde-fou : au-delà, c'est que la zone n'était pas fermée. On renonce plutôt
// que de recouvrir toute la carte.
const PROPORTION_MAXIMALE = 0.55;

const enComposantes = (couleur) => [
  Number.parseInt(couleur.slice(1, 3), 16),
  Number.parseInt(couleur.slice(3, 5), 16),
  Number.parseInt(couleur.slice(5, 7), 16),
];

// Un pixel sombre est un contour : le remplissage s'y arrête.
const estClair = (pixels, position) =>
  pixels[position] * 0.299 + pixels[position + 1] * 0.587 + pixels[position + 2] * 0.114 >
  SEUIL_DU_CONTOUR;

// Remplissage par lignes : bien plus rapide qu'un parcours pixel par pixel.
export const marquerLaZone = (pixels, largeur, hauteur, departX, departY) => {
  const zone = new Uint8Array(largeur * hauteur);
  const aExplorer = [[departX, departY]];
  let comptees = 0;

  while (aExplorer.length > 0) {
    const [x, depart] = aExplorer.pop();
    let y = depart;
    while (y >= 0 && !zone[y * largeur + x] && estClair(pixels, (y * largeur + x) * 4)) y -= 1;
    y += 1;

    let voisinGaucheAjoute = false;
    let voisinDroitAjoute = false;
    while (y < hauteur && !zone[y * largeur + x] && estClair(pixels, (y * largeur + x) * 4)) {
      zone[y * largeur + x] = 1;
      comptees += 1;
      if (comptees > largeur * hauteur * PROPORTION_MAXIMALE) return null;

      const gaucheClaire = x > 0 && estClair(pixels, (y * largeur + x - 1) * 4);
      if (gaucheClaire && !voisinGaucheAjoute) aExplorer.push([x - 1, y]);
      voisinGaucheAjoute = gaucheClaire;

      const droiteClaire = x < largeur - 1 && estClair(pixels, (y * largeur + x + 1) * 4);
      if (droiteClaire && !voisinDroitAjoute) aExplorer.push([x + 1, y]);
      voisinDroitAjoute = droiteClaire;

      y += 1;
    }
  }
  return zone;
};

// Peint la zone marquée sur un calque, puis le compose sur le coloriage.
const peindre = (contexteDeColoriage, zone, largeur, hauteur, couleur) => {
  const calque = document.createElement('canvas');
  calque.width = largeur;
  calque.height = hauteur;
  const contexteDuCalque = calque.getContext('2d');
  const image = contexteDuCalque.createImageData(largeur, hauteur);
  const [rouge, vert, bleu] = enComposantes(couleur);

  for (let position = 0; position < zone.length; position += 1) {
    if (!zone[position]) continue;
    const pixel = position * 4;
    image.data[pixel] = rouge;
    image.data[pixel + 1] = vert;
    image.data[pixel + 2] = bleu;
    image.data[pixel + 3] = 255;
  }
  contexteDuCalque.putImageData(image, 0, 0);

  // Transformation neutralisée : le calque est déjà en pixels de l'écran.
  contexteDeColoriage.save();
  contexteDeColoriage.setTransform(1, 0, 0, 1, 0, 0);
  contexteDeColoriage.globalAlpha = 1;
  contexteDeColoriage.globalCompositeOperation = 'source-over';
  contexteDeColoriage.drawImage(calque, 0, 0);
  contexteDeColoriage.restore();
};

// Renvoie vrai si une zone a bien été remplie.
export const remplirDepuisLePoint = ({ contexteDeLaCarte, contexteDeColoriage, positionX, positionY, couleur }) => {
  const carte = contexteDeLaCarte.canvas;
  const largeur = carte.width;
  const hauteur = carte.height;
  if (largeur === 0 || hauteur === 0) return false;

  // Du repère de la page vers les pixels réels du canevas.
  const echelle = largeur / carte.clientWidth;
  const departX = Math.round(positionX * echelle);
  const departY = Math.round(positionY * echelle);
  if (departX < 0 || departY < 0 || departX >= largeur || departY >= hauteur) return false;

  const pixels = contexteDeLaCarte.getImageData(0, 0, largeur, hauteur).data;
  if (!estClair(pixels, (departY * largeur + departX) * 4)) return false;

  const zone = marquerLaZone(pixels, largeur, hauteur, departX, departY);
  if (!zone) return false;
  peindre(contexteDeColoriage, zone, largeur, hauteur, couleur);
  return true;
};
