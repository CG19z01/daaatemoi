// Aiguillage des appuis sur la carte selon l'outil choisi.
//
//   Feutre  : trace un trait, il faut maintenir l'appui (branché ailleurs)
//   Gomme   : efface les traits et les remplissages, même geste
//   Coloriage : un seul appui remplit la zone visée
//   Texte   : un seul appui crée une zone de texte à cet endroit
//
// Le fond de carte, les bâtiments et les points des lieux ne sont jamais
// modifiés : tout se passe sur la couche de coloriage et la couche de textes.
import { redresserDesMetres } from '../carte/projection.js';
import { placementEnCours } from './placement-de-point.js';
import { remplirDepuisLePoint } from './remplissage.js';
import { OUTIL_COLORIAGE, OUTIL_TEXTE, outilDeTrace } from './outils-de-carte.js';
import { MODE_REMPLISSAGE } from '../carte/coloration.js';

const TAILLE_DU_TEXTE_PAR_DEFAUT = 20;
const COULEUR_DU_TEXTE_PAR_DEFAUT = '#000000';

const positionDansLaScene = (scene, evenement) => {
  const zone = scene.getBoundingClientRect();
  return { x: evenement.clientX - zone.left, y: evenement.clientY - zone.top };
};

export const brancherLesGestes = ({ scene, coloration, textes, outils, laProjection, leContexteDeLaCarte, signaler }) => {
  const remplir = (position) => {
    const projection = laProjection();
    if (!projection) return;
    const rempli = remplirDepuisLePoint({
      contexteDeLaCarte: leContexteDeLaCarte(),
      contexteDeColoriage: coloration.leContexte(),
      positionX: position.x,
      positionY: position.y,
      couleur: outils.couleurActuelle(),
    });
    if (!rempli) {
      signaler?.('Cette zone ne peut pas être remplie. Vise l’intérieur d’un contour.');
      return;
    }
    // Seul le point visé est retenu : la zone se recalcule à chaque affichage.
    const vue = projection.versMetriqueDepuisEcran(position.x, position.y);
    const brut = redresserDesMetres(vue.x, vue.y);
    coloration.ajouterUnRemplissage({
      mode: MODE_REMPLISSAGE,
      couleur: outils.couleurActuelle(),
      tailleEnMetres: 0,
      points: [[Math.round(brut.x), Math.round(brut.y)]],
    });
  };

  const creerUnTexte = (position) => {
    const projection = laProjection();
    if (!projection) return;
    const vue = projection.versMetriqueDepuisEcran(position.x, position.y);
    const brut = redresserDesMetres(vue.x, vue.y);
    textes.ajouterEtEditer({
      contenu: '',
      point: { x: Math.round(brut.x), y: Math.round(brut.y) },
      couleur: COULEUR_DU_TEXTE_PAR_DEFAUT,
      taille: TAILLE_DU_TEXTE_PAR_DEFAUT,
    });
  };

  scene.addEventListener('pointerdown', (evenement) => {
    if (placementEnCours()) return;
    // Un appui sur un point de lieu ou sur un texte a sa propre action.
    if (evenement.target.closest('.marqueur') || evenement.target.closest('.texte-de-carte')) return;
    const outil = outils.outilActuel();
    if (outilDeTrace(outil)) return;
    const position = positionDansLaScene(scene, evenement);
    if (outil === OUTIL_COLORIAGE) remplir(position);
    else if (outil === OUTIL_TEXTE) creerUnTexte(position);
  });
};
