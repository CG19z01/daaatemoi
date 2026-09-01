// Requete Overpass servant a extraire le fond de carte d'une ville : le fleuve
// ou les canaux, le reseau de voies et les parcs. Une seule requete pour les
// quatre familles, le tri se fait ensuite a partir des etiquettes.
import { boiteAutourDuCentre } from './overpass.js';

export const RAYON_DE_LA_VILLE_EN_METRES = 2500;
const DELAI_OVERPASS_EN_SECONDES = 50;

const VOIES_PRINCIPALES = 'motorway|trunk|primary|secondary';
const VOIES_SECONDAIRES = 'tertiary|residential|unclassified|pedestrian|living_street';

export const composerLaRequeteDeVille = (centre) => {
  const boite = boiteAutourDuCentre(centre, RAYON_DE_LA_VILLE_EN_METRES);
  return [
    `[out:json][timeout:${DELAI_OVERPASS_EN_SECONDES}];`,
    '(',
    `  way["waterway"~"^(river|canal)$"](${boite});`,
    `  way["highway"~"^(${VOIES_PRINCIPALES})(_link)?$"](${boite});`,
    `  way["highway"~"^(${VOIES_SECONDAIRES})$"](${boite});`,
    `  way["leisure"~"^(park|garden)$"](${boite});`,
    ');',
    'out geom;',
  ].join('\n');
};
