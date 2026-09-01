// Zone réellement bâtie d'une ville, déduite de la densité de son réseau de
// voies. C'est elle qui cadre la carte.
//
// Prendre simplement les extrêmes ne marche pas : Overpass rend les voies
// entières, et deux routes de campagne suffisent à étirer le cadre sur dix
// kilomètres de champs. On écarte donc les extrémités par percentiles : le
// centre dense, où se concentrent les points, l'emporte sur les échappées.
const PERCENTILE_BAS = 0.04;
const PERCENTILE_HAUT = 0.96;
// Au-delà, le tri coûterait sans rien changer au résultat.
const POINTS_EXAMINES = 40000;
// Une bourgade ne doit pas se retrouver grossie à l'excès.
const ETENDUE_MINIMALE_EN_METRES = 1400;

const percentile = (valeursTriees, proportion) =>
  valeursTriees[Math.min(valeursTriees.length - 1, Math.floor(valeursTriees.length * proportion))];

// Un point sur N si le réseau est très dense : la répartition reste la même.
const echantillonner = (voies) => {
  const total = voies.reduce((somme, voie) => somme + voie.length, 0);
  const pas = Math.max(1, Math.ceil(total / POINTS_EXAMINES));
  const abscisses = [];
  const ordonnees = [];
  let rang = 0;
  for (const voie of voies) {
    for (const [x, y] of voie) {
      if (rang % pas === 0) {
        abscisses.push(x);
        ordonnees.push(y);
      }
      rang += 1;
    }
  }
  return { abscisses, ordonnees };
};

// Élargit une plage trop étroite autour de son milieu.
const elargirSiNecessaire = (minimum, maximum) => {
  const manque = ETENDUE_MINIMALE_EN_METRES - (maximum - minimum);
  if (manque <= 0) return [minimum, maximum];
  return [minimum - manque / 2, maximum + manque / 2];
};

// Renvoie { minimumX, maximumX, minimumY, maximumY } en mètres bruts,
// ou la zone de repli fournie si aucune voie n'a été extraite.
export const mesurerLaZoneBatie = (voies, zoneDeRepli) => {
  const { abscisses, ordonnees } = echantillonner(voies);
  if (abscisses.length === 0) return zoneDeRepli;

  abscisses.sort((premier, second) => premier - second);
  ordonnees.sort((premier, second) => premier - second);

  const [minimumX, maximumX] = elargirSiNecessaire(
    percentile(abscisses, PERCENTILE_BAS),
    percentile(abscisses, PERCENTILE_HAUT),
  );
  const [minimumY, maximumY] = elargirSiNecessaire(
    percentile(ordonnees, PERCENTILE_BAS),
    percentile(ordonnees, PERCENTILE_HAUT),
  );
  return {
    minimumX: Math.round(minimumX),
    maximumX: Math.round(maximumX),
    minimumY: Math.round(minimumY),
    maximumY: Math.round(maximumY),
  };
};
