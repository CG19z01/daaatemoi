// Validation des traits de coloriage : rien de ce qui vient du navigateur
// n'est stocke sans verification de forme et de bornes.
// Le remplissage n'est pas un trace : il retient seulement le point vise et la
// couleur. La zone est recalculee a l'affichage, en suivant les contours reels
// de la carte, ce qui la rend juste a n'importe quelle taille d'ecran.
export const MODE_REMPLISSAGE = 'remplissage';
const MODES = new Set(['feutre', 'gomme', MODE_REMPLISSAGE]);
const COULEUR_VALIDE = /^#[0-9a-f]{6}$/i;
const POINTS_MAXIMAUX = 400;
const PORTEE_MAXIMALE_EN_METRES = 8000;
const TAILLE_MINIMALE_EN_METRES = 0.5;
const TAILLE_MAXIMALE_EN_METRES = 3000;

const estUnNombre = (valeur) => typeof valeur === 'number' && Number.isFinite(valeur);

const pointValide = (point) =>
  Array.isArray(point) &&
  point.length === 2 &&
  point.every((valeur) => estUnNombre(valeur) && Math.abs(valeur) <= PORTEE_MAXIMALE_EN_METRES);

// Un remplissage tient en un seul point : sa taille n'a pas de sens.
const validerUnRemplissage = (couleur, points) => {
  if (!COULEUR_VALIDE.test(couleur)) return { erreur: 'Remplissage invalide.' };
  if (!Array.isArray(points) || points.length !== 1 || !pointValide(points[0])) {
    return { erreur: 'Remplissage invalide.' };
  }
  const [x, y] = points[0];
  return {
    trait: {
      mode: MODE_REMPLISSAGE,
      couleur,
      tailleEnMetres: 0,
      points: [[Math.round(x), Math.round(y)]],
    },
  };
};

// Renvoie { trait } ou { erreur }.
export const validerUnTrait = (traitRecu) => {
  const { mode, couleur, tailleEnMetres, points } = traitRecu ?? {};
  if (!MODES.has(mode)) return { erreur: 'Trait invalide.' };
  if (mode === MODE_REMPLISSAGE) return validerUnRemplissage(couleur, points);
  if (!COULEUR_VALIDE.test(couleur)) return { erreur: 'Trait invalide.' };
  if (!estUnNombre(tailleEnMetres)) return { erreur: 'Trait invalide.' };
  if (tailleEnMetres < TAILLE_MINIMALE_EN_METRES || tailleEnMetres > TAILLE_MAXIMALE_EN_METRES) {
    return { erreur: 'Trait invalide.' };
  }
  if (!Array.isArray(points) || points.length === 0 || points.length > POINTS_MAXIMAUX) {
    return { erreur: 'Trait invalide.' };
  }
  if (!points.every(pointValide)) return { erreur: 'Trait invalide.' };

  return {
    trait: {
      mode,
      couleur,
      tailleEnMetres: Math.round(tailleEnMetres * 100) / 100,
      points: points.map(([x, y]) => [Math.round(x), Math.round(y)]),
    },
  };
};
