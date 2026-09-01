// Conversion d'un extrait OpenStreetMap en fond de carte du projet : des metres
// relatifs au centre de la ville, simplifies, exactement comme le fichier fige
// de Rouen. Le rendu cartoon au trait n'a besoin de rien d'autre.
import {
  creerConvertisseurEnMetres,
  simplifierUnTrace,
  retirerLesDoublons,
  decouperDansLaZone,
  horsDeLaZone,
} from '../utilitaires/geometrie.js';
import { mesurerLaZoneBatie } from './zone-batie.js';

// Marque de fabrique du fond. Un fond produit par une version anterieure est
// regenere : c'est ce qui permet de faire evoluer le cadrage sans vider le cache
// a la main, en local comme en production.
export const VERSION_DU_FOND = 2;
// Plus la ville est grande, plus le trace est simplifie : le fond garde ainsi
// un poids comparable, qu'il couvre un village ou une metropole.
const finesse = (rayon) => Math.max(8, Math.round(rayon / 180));
// Overpass rend les voies entieres : on les recoupe un peu au-dela de la zone
// demandee, pour que le trace file hors champ sans peser inutilement.
const limiteDuTrace = (rayon) => rayon * 1.4;
// Bornes de securite : un centre-ville tres dense ne doit pas produire un fond
// trop lourd a stocker puis a redessiner sur un telephone.
const MAXIMUM = { riviere: 80, voiesPrincipales: 2200, voiesSecondaires: 5000, parcs: 320 };
const LARGEUR_PAR_DEFAUT = { river: 90, canal: 25 };

const EST_PRINCIPALE = /^(motorway|trunk|primary|secondary)(_link)?$/;
const EST_SECONDAIRE = /^(tertiary|residential|unclassified|pedestrian|living_street)$/;

const classer = (etiquettes = {}) => {
  if (etiquettes.waterway === 'river' || etiquettes.waterway === 'canal') return 'riviere';
  if (etiquettes.leisure === 'park' || etiquettes.leisure === 'garden') return 'parcs';
  if (EST_PRINCIPALE.test(etiquettes.highway ?? '')) return 'voiesPrincipales';
  if (EST_SECONDAIRE.test(etiquettes.highway ?? '')) return 'voiesSecondaires';
  return null;
};

// Largeur du cours d'eau : celle d'OpenStreetMap si elle est renseignee,
// sinon une valeur typique selon le type. Rien n'est invente au-dela.
const largeurDuCoursDEau = (etiquettes) => {
  const declaree = Number.parseFloat(etiquettes.width ?? etiquettes['water:width']);
  if (Number.isFinite(declaree) && declaree > 0) return Math.min(400, Math.round(declaree));
  return LARGEUR_PAR_DEFAUT[etiquettes.waterway] ?? 40;
};

// Un parc reste d'un seul tenant : hors zone il est ecarte, jamais coupe.
const ajouterUnParc = (fond, points, limite) => {
  if (points.length < 4 || horsDeLaZone(points, limite)) return;
  fond.parcs.push(points);
};

const ajouterUneLigne = (fond, famille, points, etiquettes, limite) => {
  for (const morceau of decouperDansLaZone(points, limite)) {
    if (fond[famille].length >= MAXIMUM[famille]) return;
    if (famille === 'riviere') {
      fond.riviere.push({ largeur: largeurDuCoursDEau(etiquettes), points: morceau });
    } else {
      fond[famille].push(morceau);
    }
  }
};

export const construireLeFondDeVille = (elements, centre, mesure) => {
  const versMetres = creerConvertisseurEnMetres(centre);
  const fond = { riviere: [], voiesPrincipales: [], voiesSecondaires: [], parcs: [] };
  const toleranceDesVoies = finesse(mesure.rayon);
  const toleranceDesContours = Math.round(toleranceDesVoies / 1.8);
  const limite = limiteDuTrace(mesure.rayon);

  for (const element of elements) {
    if (!Array.isArray(element?.geometry) || element.geometry.length < 2) continue;
    const famille = classer(element.tags);
    if (!famille || fond[famille].length >= MAXIMUM[famille]) continue;

    const tolerance = famille === 'voiesSecondaires' ? toleranceDesVoies : toleranceDesContours;
    const points = simplifierUnTrace(retirerLesDoublons(element.geometry.map(versMetres)), tolerance);

    if (famille === 'parcs') ajouterUnParc(fond, points, limite);
    else ajouterUneLigne(fond, famille, points, element.tags, limite);
  }

  return {
    source: 'OpenStreetMap (c) les contributeurs, licence ODbL',
    repere: 'm',
    version: VERSION_DU_FOND,
    centre: { latitude: centre.latitude, longitude: centre.longitude },
    // Zone a cadrer a l'ecran, en metres bruts : c'est elle qui adapte le zoom
    // a chaque ville, sans niveau de zoom commun a toutes.
    zone: mesurerLaZoneBatie([...fond.voiesPrincipales, ...fond.voiesSecondaires], {
      minimumX: -mesure.etendue.largeur / 2,
      maximumX: mesure.etendue.largeur / 2,
      minimumY: -mesure.etendue.profondeur / 2,
      maximumY: mesure.etendue.profondeur / 2,
    }),
    ...fond,
  };
};
