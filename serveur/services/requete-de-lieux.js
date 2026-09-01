// Requete Overpass de recherche d'un lieu. Deux facons de trouver :
//   - par le nom, en tolerant les accents (« cafe » retrouve « Café ») ;
//   - par la categorie, pour une recherche large (« cinema », « bar »).
// Le terme est deja reduit a un jeu de caracteres sur en amont : aucune syntaxe
// Overpass ni aucun guillemet ne peut se glisser dans la requete.
import { boiteAutourDuCentre } from './overpass.js';

export const FAMILLES = ['amenity', 'shop', 'leisure', 'tourism'];
export const RAYON_DE_RECHERCHE_EN_METRES = 5000;
const DELAI_OVERPASS_EN_SECONDES = 25;

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

const sansAccents = (texte) =>
  texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const motifDuNom = (terme) =>
  [...sansAccents(terme)]
    .map((lettre) => (VARIANTES[lettre] ? `[${VARIANTES[lettre]}]` : lettre))
    .join('');

// Les categories d'OpenStreetMap s'ecrivent avec des tirets bas : « fast food »
// devient « fast_food ».
export const motifDeLaCategorie = (terme) => sansAccents(terme).replace(/[ '-]+/g, '_');

export const composerLaRequeteDeLieux = (terme, centre) => {
  const boite = boiteAutourDuCentre(centre, RAYON_DE_RECHERCHE_EN_METRES);
  const parLeNom = FAMILLES.map(
    (famille) => `  nwr["name"~"${motifDuNom(terme)}",i]["${famille}"](${boite});`,
  );
  const parLaCategorie = FAMILLES.map(
    (famille) => `  nwr["${famille}"~"^${motifDeLaCategorie(terme)}$",i]["name"](${boite});`,
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
