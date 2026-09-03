// Scène de carte réutilisable : le rendu cartoon au trait, pour la ville que
// la personne a choisie. Les modules de dessin, de décor et de projection sont
// partagés, sans duplication.
import {
  creerProjection,
  definirLOrientationDuMonde,
  pivoterDesMetres,
} from '../carte/projection.js';
import { construireDecor } from '../carte/decor.js';
import { nettoyerLeFond } from '../carte/fond-de-carte.js';
import { dessinerLaCarte } from '../carte/rendu.js';
import { creerColoration } from '../carte/coloration.js';
import { cadreDeLaZone, limiteDuDecor, restreindreAuxDonnees } from './cadre-de-ville.js';
import { remplirDepuisLePoint } from './remplissage.js';

const RATIO_MAXIMUM = 2;
const DELAI_DE_REDIMENSIONNEMENT = 150;

export const creerLaScene = ({ scene, canvasCarte, canvasColoration }) => {
  const contexteCarte = canvasCarte.getContext('2d', { willReadFrequently: true });
  const coloration = creerColoration(canvasColoration);
  const auxRedimensionnements = [];

  let fondBrut = null;
  let zone = null;
  let cadre = null;
  let decor = null;
  let projection = null;

  // Le nord reste toujours en haut : la carte ne pivote jamais, quelle que soit
  // l'orientation de l'écran. Seule l'échelle s'adapte à la place disponible.
  const preparerLaVue = () => {
    if (decor) return;
    definirLOrientationDuMonde(false);
    cadre = cadreDeLaZone(zone);
    decor = construireDecor(fondBrut, [], limiteDuDecor(cadre, fondBrut.portee));
  };

  const redimensionner = () => {
    if (!fondBrut) return;
    const largeur = scene.clientWidth;
    const hauteur = scene.clientHeight;
    if (largeur === 0 || hauteur === 0) return;
    preparerLaVue();

    const ratio = Math.min(window.devicePixelRatio || 1, RATIO_MAXIMUM);
    canvasCarte.width = Math.round(largeur * ratio);
    canvasCarte.height = Math.round(hauteur * ratio);
    contexteCarte.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Le cadre décrit la ville, la projection l'ajuste à l'écran disponible :
    // le cadrage se recalcule donc tout seul à chaque changement de taille.
    // Premier cadrage : la ville entière. Puis on resserre si l'écran regardait
    // au-delà des données, pour qu'aucun bord de carte ne soit jamais visible.
    projection = creerProjection(largeur, hauteur, cadre);
    const cadreVu = restreindreAuxDonnees(cadre, fondBrut.portee, projection, largeur, hauteur);
    if (cadreVu !== cadre) projection = creerProjection(largeur, hauteur, cadreVu);
    // La carte est redessinee avant le coloriage : un remplissage relit ses
    // pixels pour retrouver la zone, il lui faut donc une carte a jour.
    dessinerLaCarte(contexteCarte, fondBrut, decor, projection, { largeur, hauteur });
    coloration.redimensionner(largeur, hauteur, ratio, projection);
    for (const rappel of auxRedimensionnements) rappel(projection);
  };

  // Installe le fond d'une ville. Tout y est déjà en mètres relatifs à son
  // centre : la scène n'a besoin d'aucune coordonnée géographique.
  const definirLaVille = (fond) => {
    // Le coloriage appartenait a la ville precedente : il s'efface avec elle.
    coloration.effacerLesTraits();
    zone = fond?.zone ?? null;
    fondBrut = nettoyerLeFond(fond);
    decor = null;
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
