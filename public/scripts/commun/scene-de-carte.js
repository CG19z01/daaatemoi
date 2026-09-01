// Scene de carte reutilisable : meme rendu cartoon au trait que la carte de
// Rouen, mais pour n'importe quelle ville. Les modules de dessin, de decor et
// de projection sont ceux de la carte existante, sans duplication.
import {
  creerProjection,
  definirLOrientationDuMonde,
  definirLeCentreDuMonde,
  ETENDUE_PAR_DEFAUT,
} from '../carte/projection.js';
import { construireDecor } from '../carte/decor.js';
import { orienterLeFond, nettoyerLeFond } from '../carte/fond-de-carte.js';
import { dessinerLaCarte } from '../carte/rendu.js';
import { creerColoration } from '../carte/coloration.js';

const RATIO_MAXIMUM = 2;
const DELAI_DE_REDIMENSIONNEMENT = 150;
// Cadre fixe : la carte ne se recadre pas a chaque point ajoute.
const CADRE = { centre: { x: 0, y: 0 }, etendue: ETENDUE_PAR_DEFAUT };

export const creerLaScene = ({ scene, canvasCarte, canvasColoration }) => {
  const contexteCarte = canvasCarte.getContext('2d');
  const coloration = creerColoration(canvasColoration);
  const auxRedimensionnements = [];

  let fondBrut = null;
  let fondOriente = null;
  let decor = null;
  let projection = null;
  let enPortrait = null;

  // Le monde pivote d'un quart de tour en portrait : le decor est refait.
  const preparerLOrientation = (portrait) => {
    if (enPortrait === portrait) return;
    enPortrait = portrait;
    definirLOrientationDuMonde(portrait);
    fondOriente = orienterLeFond(fondBrut, portrait);
    decor = construireDecor(fondOriente, []);
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
    projection = creerProjection(largeur, hauteur, CADRE);
    coloration.redimensionner(largeur, hauteur, ratio, projection);
    dessinerLaCarte(contexteCarte, fondOriente, decor, projection, { largeur, hauteur });
    for (const rappel of auxRedimensionnements) rappel(projection);
  };

  // Installe le fond d'une ville : ses coordonnees sont deja en metres,
  // relatives au centre que la projection doit adopter.
  const definirLaVille = (fond, centre) => {
    definirLeCentreDuMonde(centre ?? fond?.centre);
    fondBrut = nettoyerLeFond(fond);
    enPortrait = null;
    redimensionner();
  };

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
    surRedimensionnement: (rappel) => auxRedimensionnements.push(rappel),
  };
};
