// Validation des traits de coloriage : rien de ce qui vient du navigateur
// n'est stocke sans verification de forme et de bornes.
const MODES = new Set(['feutre', 'gomme']);
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

// Renvoie { trait } ou { erreur }.
export const validerUnTrait = (traitRecu) => {
  const { mode, couleur, tailleEnMetres, points } = traitRecu ?? {};
  if (!MODES.has(mode)) return { erreur: 'Trait invalide.' };
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
