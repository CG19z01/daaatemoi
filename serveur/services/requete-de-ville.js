// Requete Overpass servant a extraire le fond de carte d'une ville : le fleuve
// ou les canaux, le reseau de voies et les parcs. Une seule requete pour les
// quatre familles, le tri se fait ensuite a partir des etiquettes.
// Le rayon depend de la taille reelle de la ville, jamais d'une valeur fixe.
import { boiteAutourDuCentre } from './overpass.js';

const DELAI_OVERPASS_EN_SECONDES = 60;

const VOIES_PRINCIPALES = 'motorway|trunk|primary|secondary';
const VOIES_SECONDAIRES = 'tertiary|residential|unclassified|pedestrian|living_street';

export const composerLaRequeteDeVille = (centre, rayonEnMetres) => {
  const boite = boiteAutourDuCentre(centre, rayonEnMetres);
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
