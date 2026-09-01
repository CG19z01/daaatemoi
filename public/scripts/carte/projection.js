// Projection geographique vers un rendu pseudo-3D : la carte est inclinee et cisaillee.
// En portrait, le monde entier pivote d'un quart de tour pour que son axe long
// suive la hauteur de l'ecran : le dessin reste lisible sans rien deplacer.
// Centre historique du projet. Une experience creee sur une autre ville
// remplace ce centre par le sien : tout le reste du rendu est inchange.
const CENTRE_DE_ROUEN = { latitude: 49.4375, longitude: 1.0985 };

const METRES_PAR_DEGRE_LATITUDE = 110574;
const METRES_PAR_DEGRE_LONGITUDE_A_L_EQUATEUR = 111320;

const metresParDegreLongitude = (latitude) =>
  METRES_PAR_DEGRE_LONGITUDE_A_L_EQUATEUR * Math.cos((latitude * Math.PI) / 180);

let centreDuMonde = CENTRE_DE_ROUEN;
let metresParDegreLongitudeActuels = metresParDegreLongitude(CENTRE_DE_ROUEN.latitude);

export const definirLeCentreDuMonde = (centre) => {
  if (typeof centre?.latitude !== 'number' || typeof centre?.longitude !== 'number') return;
  centreDuMonde = { latitude: centre.latitude, longitude: centre.longitude };
  metresParDegreLongitudeActuels = metresParDegreLongitude(centre.latitude);
};

const INCLINAISON = 0.55;
const CISAILLEMENT_PAYSAGE = 0.25;
const CISAILLEMENT_PORTRAIT = 0.18;
const MARGE_AUTOUR_DES_LIEUX = 300;
export const ETENDUE_PAR_DEFAUT = { largeur: 2500, profondeur: 2700 };

let mondePivote = false;

export const definirLOrientationDuMonde = (pivote) => {
  mondePivote = pivote;
};

// Un quart de tour applique aux metres : tout le reste du code l'ignore.
export const pivoterDesMetres = (x, y) => (mondePivote ? { x: y, y: -x } : { x, y });

// Rotation inverse : de la vue pivotee vers les metres bruts.
export const redresserDesMetres = (x, y) => (mondePivote ? { x: -y, y: x } : { x, y });

// Des metres du monde vers une latitude et une longitude.
export const versCoordonnees = ({ x, y }) => {
  const brut = redresserDesMetres(x, y);
  return {
    latitude: centreDuMonde.latitude + brut.y / METRES_PAR_DEGRE_LATITUDE,
    longitude: centreDuMonde.longitude + brut.x / metresParDegreLongitudeActuels,
  };
};

export const aDesCoordonnees = (lieu) =>
  typeof lieu.latitude === 'number' && typeof lieu.longitude === 'number';

export const versMetres = ({ latitude, longitude }) =>
  pivoterDesMetres(
    (longitude - centreDuMonde.longitude) * metresParDegreLongitudeActuels,
    (latitude - centreDuMonde.latitude) * METRES_PAR_DEGRE_LATITUDE,
  );

// Le cadre s'ajuste aux lieux places : ni bande vide, ni zoom inutile.
export const calculerLeCadre = (listeDesLieux) => {
  const positions = listeDesLieux.filter(aDesCoordonnees).map(versMetres);
  if (positions.length === 0) return { centre: { x: 0, y: 0 }, etendue: ETENDUE_PAR_DEFAUT };
  const abscisses = positions.map((position) => position.x);
  const ordonnees = positions.map((position) => position.y);
  const minimumX = Math.min(...abscisses);
  const maximumX = Math.max(...abscisses);
  const minimumY = Math.min(...ordonnees);
  const maximumY = Math.max(...ordonnees);
  return {
    centre: { x: (minimumX + maximumX) / 2, y: (minimumY + maximumY) / 2 },
    etendue: {
      largeur: maximumX - minimumX + MARGE_AUTOUR_DES_LIEUX * 2,
      profondeur: maximumY - minimumY + MARGE_AUTOUR_DES_LIEUX * 2,
    },
  };
};

export const creerProjection = (largeur, hauteur, cadre) => {
  const centreVise = cadre?.centre ?? { x: 0, y: 0 };
  const etendue = cadre?.etendue ?? ETENDUE_PAR_DEFAUT;
  const cisaillement = hauteur > largeur ? CISAILLEMENT_PORTRAIT : CISAILLEMENT_PAYSAGE;
  const echelle = Math.min(
    largeur / (etendue.largeur + etendue.profondeur * cisaillement),
    hauteur / (etendue.profondeur * INCLINAISON),
  );
  const centreEcran = { x: largeur / 2, y: hauteur / 2 };

  const versEcranMetrique = (x, y, altitude = 0) => {
    const ecartX = x - centreVise.x;
    const ecartY = y - centreVise.y;
    return {
      x: centreEcran.x + (ecartX + ecartY * cisaillement) * echelle,
      y: centreEcran.y - ecartY * INCLINAISON * echelle - altitude * echelle,
    };
  };

  // Chemin retour : on annule l'inclinaison, puis le cisaillement.
  const versMetriqueDepuisEcran = (positionX, positionY) => {
    const ecartY = (centreEcran.y - positionY) / (INCLINAISON * echelle);
    const ecartX = (positionX - centreEcran.x) / echelle - ecartY * cisaillement;
    return { x: ecartX + centreVise.x, y: ecartY + centreVise.y };
  };

  return {
    echelle,
    inclinaison: INCLINAISON,
    versEcranMetrique,
    versMetriqueDepuisEcran,
    versCoordonneesDepuisEcran: (positionX, positionY) =>
      versCoordonnees(versMetriqueDepuisEcran(positionX, positionY)),
    versEcran: (position, altitude = 0) => {
      const { x, y } = versMetres(position);
      return versEcranMetrique(x, y, altitude);
    },
  };
};
