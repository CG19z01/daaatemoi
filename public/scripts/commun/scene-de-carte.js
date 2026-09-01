// Scène de carte réutilisable : même rendu cartoon au trait que la carte de
// Rouen, mais pour n'importe quelle ville. Les modules de dessin, de décor et
// de projection sont ceux de la carte existante, sans duplication.
import {
  creerProjection,
  definirLOrientationDuMonde,
  definirLeCentreDuMonde,
  pivoterDesMetres,
} from '../carte/projection.js';
import { construireDecor } from '../carte/decor.js';
import { orienterLeFond, nettoyerLeFond } from '../carte/fond-de-carte.js';
import { dessinerLaCarte } from '../carte/rendu.js';
import { creerColoration } from '../carte/coloration.js';
import { cadreDeLaZone, limiteDuDecor } from './cadre-de-ville.js';
import { remplirDepuisLePoint } from './remplissage.js';

const RATIO_MAXIMUM = 2;
const DELAI_DE_REDIMENSIONNEMENT = 150;

export const creerLaScene = ({ scene, canvasCarte, canvasColoration }) => {
  const contexteCarte = canvasCarte.getContext('2d', { willReadFrequently: true });
  const coloration = creerColoration(canvasColoration);
  const auxRedimensionnements = [];

  let fondBrut = null;
  let fondOriente = null;
  let zone = null;
  let cadre = null;
  let decor = null;
  let projection = null;
  let enPortrait = null;

  // Le monde pivote d'un quart de tour en portrait : cadre et décor sont refaits.
  const preparerLOrientation = (portrait) => {
    if (enPortrait === portrait) return;
    enPortrait = portrait;
    definirLOrientationDuMonde(portrait);
    fondOriente = orienterLeFond(fondBrut, portrait);
    cadre = cadreDeLaZone(zone);
    decor = construireDecor(fondOriente, [], limiteDuDecor(cadre));
  };

  const redimensionner = () => {
    if (!fondBrut) return;
    const largeur = scene.clientWidth;
    const hauteur = scene.clientHeight;
    if (largeur === 0 || hauteur === 0) return;
    preparerLOrientation(hauteur > largeur);

    const ratio = Math.min(window.devicePixelRatio || 1, RATIO_MAXIMUM);
    canvasCarte.width = Math.round(largeur * ratio);
    canvasCarte.height = Math.round(hauteur * ratio);
    contexteCarte.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Le cadre décrit la ville, la projection l'ajuste à l'écran disponible :
    // le cadrage se recalcule donc tout seul à chaque changement de taille.
    projection = creerProjection(largeur, hauteur, cadre);
    // La carte est redessinee avant le coloriage : un remplissage relit ses
    // pixels pour retrouver la zone, il lui faut donc une carte a jour.
    dessinerLaCarte(contexteCarte, fondOriente, decor, projection, { largeur, hauteur });
    coloration.redimensionner(largeur, hauteur, ratio, projection);
    for (const rappel of auxRedimensionnements) rappel(projection);
  };

  // Installe le fond d'une ville : ses coordonnées sont déjà en mètres,
  // relatives au centre que la projection doit adopter.
  const definirLaVille = (fond, centre) => {
    definirLeCentreDuMonde(centre ?? fond?.centre);
    zone = fond?.zone ?? null;
    fondBrut = nettoyerLeFond(fond);
    enPortrait = null;
    redimensionner();
  };

  // Un remplissage ne retient que le point visé : la zone est recalculée ici,
  // sur la carte réellement affichée. Elle reste donc juste à toute échelle.
  coloration.definirLeRemplissage((trait) => {
    if (!projection) return;
    const [x, y] = trait.points[0];
    const pivote = pivoterDesMetres(x, y);
    const position = projection.versEcranMetrique(pivote.x, pivote.y, 0);
    remplirDepuisLePoint({
      contexteDeLaCarte: contexteCarte,
      contexteDeColoriage: coloration.leContexte(),
      positionX: position.x,
      positionY: position.y,
      couleur: trait.couleur,
    });
  });

  let attente = null;
  window.addEventListener('resize', () => {
    clearTimeout(attente);
    attente = setTimeout(redimensionner, DELAI_DE_REDIMENSIONNEMENT);
  });

  return {
    coloration,
    definirLaVille,
    redimensionner,
    laProjection: () => projection,
    // Le remplissage a besoin des pixels de la carte pour suivre ses contours.
    leContexteDeLaCarte: () => contexteCarte,
    surRedimensionnement: (rappel) => auxRedimensionnements.push(rappel),
  };
};
