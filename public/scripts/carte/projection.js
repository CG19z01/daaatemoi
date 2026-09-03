// Rendu pseudo-3D : la carte est inclinee et cisaillee.
// En portrait, le monde entier pivote d'un quart de tour pour que son axe long
// suive la hauteur de l'ecran : le dessin reste lisible sans rien deplacer.
//
// Ce module ne connait ni latitude ni longitude : le serveur a deja tout
// converti en metres relatifs au centre de la ville, et c'est la seule unite
// qui circule ici. Il n'y a donc aucun centre par defaut a definir.

// Inclinaison de la vue. Un ecran large supporte une carte tres aplatie, qui
// donne sa fausse 3D au projet ; un ecran haut et etroit, lui, se retrouverait
// avec d immenses bandes vides au-dessus et au-dessous de la ville. On redresse
// donc la vue a mesure que le format s allonge.
const INCLINAISON_A_PLAT = 0.55;
const INCLINAISON_REDRESSEE = 0.92;
const FORMAT_LARGE = 1.5;
const FORMAT_HAUT = 0.6;

const inclinaisonAdaptee = (largeur, hauteur) => {
  const format = largeur / hauteur;
  if (format >= FORMAT_LARGE) return INCLINAISON_A_PLAT;
  if (format <= FORMAT_HAUT) return INCLINAISON_REDRESSEE;
  const avancement = (FORMAT_LARGE - format) / (FORMAT_LARGE - FORMAT_HAUT);
  return INCLINAISON_A_PLAT + avancement * (INCLINAISON_REDRESSEE - INCLINAISON_A_PLAT);
};
const CISAILLEMENT_PAYSAGE = 0.25;
const CISAILLEMENT_PORTRAIT = 0.18;
export const ETENDUE_PAR_DEFAUT = { largeur: 2500, profondeur: 2700 };

let mondePivote = false;

export const definirLOrientationDuMonde = (pivote) => {
  mondePivote = pivote;
};

// Un quart de tour applique aux metres : tout le reste du code l'ignore.
export const pivoterDesMetres = (x, y) => (mondePivote ? { x: y, y: -x } : { x, y });

// Rotation inverse : de la vue pivotee vers les metres bruts.
export const redresserDesMetres = (x, y) => (mondePivote ? { x: -y, y: x } : { x, y });

export const creerProjection = (largeur, hauteur, cadre) => {
  const centreVise = cadre?.centre ?? { x: 0, y: 0 };
  const etendue = cadre?.etendue ?? ETENDUE_PAR_DEFAUT;
  const cisaillement = hauteur > largeur ? CISAILLEMENT_PORTRAIT : CISAILLEMENT_PAYSAGE;
  const inclinaison = inclinaisonAdaptee(largeur, hauteur);
  // Fit to bounds : la plus petite des deux echelles fait entrer la ville
  // entiere, largeur et profondeur comprises.
  const echelle = Math.min(
    largeur / (etendue.largeur + etendue.profondeur * cisaillement),
    hauteur / (etendue.profondeur * inclinaison),
  );
  const centreEcran = { x: largeur / 2, y: hauteur / 2 };

  const versEcranMetrique = (x, y, altitude = 0) => {
    const ecartX = x - centreVise.x;
    const ecartY = y - centreVise.y;
    return {
      x: centreEcran.x + (ecartX + ecartY * cisaillement) * echelle,
      y: centreEcran.y - ecartY * inclinaison * echelle - altitude * echelle,
    };
  };

  // Chemin retour : on annule l'inclinaison, puis le cisaillement.
  const versMetriqueDepuisEcran = (positionX, positionY) => {
    const ecartY = (centreEcran.y - positionY) / (inclinaison * echelle);
    const ecartX = (positionX - centreEcran.x) / echelle - ecartY * cisaillement;
    return { x: ecartX + centreVise.x, y: ecartY + centreVise.y };
  };

  return {
    echelle,
    inclinaison,
    versEcranMetrique,
    versMetriqueDepuisEcran,
  };
};
