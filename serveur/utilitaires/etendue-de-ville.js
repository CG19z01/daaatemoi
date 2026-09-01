// Taille réelle d'une ville, déduite de sa boîte englobante OpenStreetMap.
// Elle sert à deux choses : décider jusqu'où extraire le fond de carte, et
// cadrer la carte pour qu'une petite ville et une grande ville soient toutes
// deux visibles dans leur ensemble, sans zoom fixe commun.
const METRES_PAR_DEGRE_LATITUDE = 110574;
const METRES_PAR_DEGRE_LONGITUDE_A_L_EQUATEUR = 111320;

// Bornes : en dessous, un village occuperait un point ; au-delà, le trait
// deviendrait illisible et l'extraction beaucoup trop lourde.
export const RAYON_MINIMAL_EN_METRES = 1300;
export const RAYON_MAXIMAL_EN_METRES = 3600;
// Un peu d'air autour de la ville, pour qu'elle ne touche pas les bords.
const MARGE = 1.08;

const demiDimensions = (boiteEnglobante, latitude) => {
  const metresParDegreLongitude =
    METRES_PAR_DEGRE_LONGITUDE_A_L_EQUATEUR * Math.cos((latitude * Math.PI) / 180);
  return {
    demiLargeur: ((boiteEnglobante.est - boiteEnglobante.ouest) / 2) * metresParDegreLongitude,
    demiProfondeur: ((boiteEnglobante.nord - boiteEnglobante.sud) / 2) * METRES_PAR_DEGRE_LATITUDE,
  };
};

const borner = (valeur) =>
  Math.round(Math.min(RAYON_MAXIMAL_EN_METRES, Math.max(RAYON_MINIMAL_EN_METRES, valeur)));

// Renvoie { rayon, etendue } en mètres. Le rayon borne l'extraction du fond,
// l'étendue décrit la zone à cadrer à l'écran.
export const mesurerLaVille = (boiteEnglobante, latitude) => {
  if (!boiteEnglobante) {
    const rayon = borner(RAYON_MINIMAL_EN_METRES * 1.6);
    return { rayon, etendue: { largeur: rayon * 2, profondeur: rayon * 2 } };
  }
  const { demiLargeur, demiProfondeur } = demiDimensions(boiteEnglobante, latitude);
  const rayon = borner(Math.max(demiLargeur, demiProfondeur) * MARGE);
  return {
    rayon,
    // L'étendue affichée ne dépasse jamais ce qui a été réellement extrait.
    etendue: {
      largeur: Math.round(Math.min(demiLargeur * MARGE, rayon) * 2),
      profondeur: Math.round(Math.min(demiProfondeur * MARGE, rayon) * 2),
    },
  };
};
