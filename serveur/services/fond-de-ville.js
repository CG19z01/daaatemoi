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
import { RAYON_DE_LA_VILLE_EN_METRES } from './requete-de-ville.js';

const TOLERANCE_DES_VOIES = 14;
const TOLERANCE_DES_CONTOURS = 8;
// Overpass rend les voies entieres : on les recoupe un peu au-dela de la zone
// demandee, pour que le trace file hors champ sans peser inutilement.
const LIMITE_DU_TRACE = RAYON_DE_LA_VILLE_EN_METRES * 1.6;
// Bornes de securite : un centre-ville tres dense ne doit pas produire un fond
// trop lourd a stocker puis a redessiner sur un telephone.
const MAXIMUM = { riviere: 60, voiesPrincipales: 1400, voiesSecondaires: 3600, parcs: 260 };
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
const ajouterUnParc = (fond, points) => {
  if (points.length < 4 || horsDeLaZone(points, LIMITE_DU_TRACE)) return;
  fond.parcs.push(points);
};

const ajouterUneLigne = (fond, famille, points, etiquettes) => {
  for (const morceau of decouperDansLaZone(points, LIMITE_DU_TRACE)) {
    if (fond[famille].length >= MAXIMUM[famille]) return;
    if (famille === 'riviere') {
      fond.riviere.push({ largeur: largeurDuCoursDEau(etiquettes), points: morceau });
    } else {
      fond[famille].push(morceau);
    }
  }
};

export const construireLeFondDeVille = (elements, centre) => {
  const versMetres = creerConvertisseurEnMetres(centre);
  const fond = { riviere: [], voiesPrincipales: [], voiesSecondaires: [], parcs: [] };

  for (const element of elements) {
    if (!Array.isArray(element?.geometry) || element.geometry.length < 2) continue;
    const famille = classer(element.tags);
    if (!famille || fond[famille].length >= MAXIMUM[famille]) continue;

    const tolerance = famille === 'voiesSecondaires' ? TOLERANCE_DES_VOIES : TOLERANCE_DES_CONTOURS;
    const points = simplifierUnTrace(retirerLesDoublons(element.geometry.map(versMetres)), tolerance);

    if (famille === 'parcs') ajouterUnParc(fond, points);
    else ajouterUneLigne(fond, famille, points, element.tags);
  }

  return {
    source: 'OpenStreetMap (c) les contributeurs, licence ODbL',
    repere: 'm',
    centre: { latitude: centre.latitude, longitude: centre.longitude },
    ...fond,
  };
};
