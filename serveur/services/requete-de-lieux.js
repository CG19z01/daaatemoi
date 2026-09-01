// Requete Overpass de recherche d'un lieu. Trois facons de trouver :
//   - par le nom, en tolerant les accents (« cafe » retrouve « Café ») ;
//   - par une categorie francaise connue (« cathedrale », « musee »), traduite
//     en etiquettes OpenStreetMap, qui sont en anglais ;
//   - par une categorie tapee directement en anglais, comme repli.
// Le terme est deja reduit a un jeu de caracteres sur en amont : aucune syntaxe
// Overpass ni aucun guillemet ne peut se glisser dans la requete.
import { boiteAutourDuCentre } from './overpass.js';
import { CATEGORIES_FRANCAISES, FAMILLES } from '../donnees/categories-osm.js';

export { FAMILLES };
const DELAI_OVERPASS_EN_SECONDES = 25;
// La recherche depasse un peu la carte : un lieu juste en peripherie reste
// trouvable, meme si son point sera place a la main sur la carte visible.
const MARGE_DE_RECHERCHE = 1.4;

// Une lettre tapee sans accent doit retrouver toutes ses variantes accentuees.
const VARIANTES = {
  a: 'aàáâäãå',
  c: 'cç',
  e: 'eéèêë',
  i: 'iíìîï',
  n: 'nñ',
  o: 'oóòôöõ',
  u: 'uúùûü',
  y: 'yÿ',
};

const sansAccents = (texte) => texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const motifDuNom = (terme) =>
  [...sansAccents(terme)]
    .map((lettre) => (VARIANTES[lettre] ? `[${VARIANTES[lettre]}]` : lettre))
    .join('');

// Les categories d'OpenStreetMap s'ecrivent avec des tirets bas : « fast food »
// devient « fast_food ».
export const motifDeLaCategorie = (terme) => sansAccents(terme).replace(/[ '-]+/g, '_');

// Paires [famille, valeur] correspondant au terme tape, table francaise d'abord.
export const categoriesVisees = (terme) => {
  const connu = CATEGORIES_FRANCAISES[sansAccents(terme).replace(/[_-]+/g, ' ').trim()];
  if (connu) return connu;
  const valeur = motifDeLaCategorie(terme);
  return FAMILLES.map((famille) => [famille, valeur]);
};

export const composerLaRequeteDeLieux = (terme, centre, rayonEnMetres) => {
  const boite = boiteAutourDuCentre(centre, Math.round(rayonEnMetres * MARGE_DE_RECHERCHE));
  const parLeNom = FAMILLES.map(
    (famille) => `  nwr["name"~"${motifDuNom(terme)}",i]["${famille}"](${boite});`,
  );
  const parLaCategorie = categoriesVisees(terme).map(
    ([famille, valeur]) => `  nwr["${famille}"~"^${valeur}$",i]["name"](${boite});`,
  );
  return [
    `[out:json][timeout:${DELAI_OVERPASS_EN_SECONDES}];`,
    '(',
    ...parLeNom,
    ...parLaCategorie,
    ');',
    'out center 60;',
  ].join('\n');
};
