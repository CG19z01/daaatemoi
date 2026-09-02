// Conversion d'un extrait OpenStreetMap en fond de carte du projet : des mètres
// relatifs au centre de la ville, simplifiés. Le rendu cartoon au trait n'a
// besoin de rien d'autre.
import {
  creerConvertisseurEnMetres,
  simplifierUnTrace,
  retirerLesDoublons,
  decouperDansLaZone,
  horsDeLaZone,
} from '../utilitaires/geometrie.js';
import { mesurerLaZoneBatie } from './zone-batie.js';
import { classer, eclaircirLeFond } from './tri-du-fond.js';

// Marque de fabrique du fond. Un fond produit par une version antérieure est
// régénéré : c'est ce qui permet de faire évoluer le rendu sans vider le cache
// à la main, en local comme en production.
export const VERSION_DU_FOND = 4;

// Plus la ville est grande, plus le tracé est simplifié : le fond garde ainsi
// un poids comparable, qu'il couvre un village ou une métropole.
const finesse = (rayon) => Math.max(8, Math.round(rayon / 180));
// Overpass rend les voies entières : on les recoupe un peu au-delà de la zone
// demandée, pour que le tracé file hors champ sans peser inutilement.
const limiteDuTrace = (rayon) => rayon * 1.4;
const LARGEUR_PAR_DEFAUT = { river: 90, canal: 25 };

const fondVide = () => ({
  riviere: [],
  littoral: [],
  plansDEau: [],
  voiesPrincipales: [],
  voiesSecondaires: [],
  parcs: [],
});

// Familles dessinées comme des surfaces fermées, jamais coupées en morceaux.
const SURFACES = new Set(['parcs', 'plansDEau']);

// Largeur du cours d'eau : celle d'OpenStreetMap si elle est renseignée,
// sinon une valeur typique selon le type. Rien n'est inventé au-delà.
const largeurDuCoursDEau = (etiquettes) => {
  const declaree = Number.parseFloat(etiquettes.width ?? etiquettes['water:width']);
  if (Number.isFinite(declaree) && declaree > 0) return Math.min(400, Math.round(declaree));
  return LARGEUR_PAR_DEFAUT[etiquettes.waterway] ?? 40;
};

const ajouterUneSurface = (fond, famille, points, limite) => {
  // Trois points suffisent : une petite mare ne doit pas disparaitre.
  if (points.length < 3 || horsDeLaZone(points, limite)) return;
  fond[famille].push(points);
};

const ajouterUneLigne = (fond, famille, points, etiquettes, limite) => {
  for (const morceau of decouperDansLaZone(points, limite)) {
    if (famille === 'riviere') {
      fond.riviere.push({ largeur: largeurDuCoursDEau(etiquettes), points: morceau });
    } else {
      fond[famille].push(morceau);
    }
  }
};

export const construireLeFondDeVille = (elements, centre, mesure) => {
  const versMetres = creerConvertisseurEnMetres(centre);
  const fond = fondVide();
  const toleranceDesVoies = finesse(mesure.rayon);
  const toleranceDesContours = Math.round(toleranceDesVoies / 1.8);
  const limite = limiteDuTrace(mesure.rayon);

  for (const element of elements) {
    if (!Array.isArray(element?.geometry) || element.geometry.length < 2) continue;
    const famille = classer(element.tags);
    if (!famille) continue;

    const tolerance = famille === 'voiesSecondaires' ? toleranceDesVoies : toleranceDesContours;
    const points = simplifierUnTrace(retirerLesDoublons(element.geometry.map(versMetres)), tolerance);

    if (SURFACES.has(famille)) ajouterUneSurface(fond, famille, points, limite);
    else ajouterUneLigne(fond, famille, points, element.tags, limite);
  }

  // L'allègement vient à la fin, réparti sur toute la ville : aucun quartier ne
  // se retrouve sans une seule rue parce qu'il arrivait en dernier.
  const allege = eclaircirLeFond(fond);
  return {
    source: 'OpenStreetMap (c) les contributeurs, licence ODbL',
    repere: 'm',
    version: VERSION_DU_FOND,
    centre: { latitude: centre.latitude, longitude: centre.longitude },
    // Zone à cadrer à l'écran, en mètres bruts : c'est elle qui adapte le zoom
    // à chaque ville, sans niveau de zoom commun à toutes.
    zone: mesurerLaZoneBatie([...allege.voiesPrincipales, ...allege.voiesSecondaires], {
      minimumX: -mesure.etendue.largeur / 2,
      maximumX: mesure.etendue.largeur / 2,
      minimumY: -mesure.etendue.profondeur / 2,
      maximumY: mesure.etendue.profondeur / 2,
    }),
    ...allege,
  };
};
