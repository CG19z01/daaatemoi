// Montage complet d'une carte d'expérience : la scène, les points des lieux,
// les zones de texte, la barre d'outils et les gestes. La page de création et
// la page invitée s'appuient toutes deux dessus, avec le même balisage.
import { creerLaScene } from './scene-de-carte.js';
import { creerLesPointsDeLieux } from './points-de-lieux.js';
import { creerLaGestionDesTextes } from './gestion-des-textes.js';
import { brancherLePlacement, placementEnCours } from './placement-de-point.js';
import { brancherLesOutilsDeCarte, outilDeTrace, OUTIL_TEXTE } from './outils-de-carte.js';
import { brancherLesGestes } from './gestes-de-carte.js';
import { brancherLaColoration } from '../carte/interactions.js';

const DUREE_DU_MESSAGE = 2600;

// Message court au-dessus de la carte, sans fenêtre ni interruption.
const creerLeSignal = () => {
  const message = document.getElementById('messageCarte');
  let attente = null;
  return (texte) => {
    message.textContent = texte;
    message.hidden = false;
    clearTimeout(attente);
    attente = setTimeout(() => {
      message.hidden = true;
    }, DUREE_DU_MESSAGE);
  };
};

export const creerLAtelier = ({ auxTextesModifies } = {}) => {
  const elementDeLaScene = document.getElementById('scene');
  const scene = creerLaScene({
    scene: elementDeLaScene,
    canvasCarte: document.getElementById('canvasCarte'),
    canvasColoration: document.getElementById('canvasColoration'),
  });

  const points = creerLesPointsDeLieux(document.getElementById('coucheMarqueurs'));
  const textes = creerLaGestionDesTextes(document.getElementById('coucheTextes'), auxTextesModifies);
  const signaler = creerLeSignal();

  scene.surRedimensionnement((projection) => {
    points.repositionner(projection);
    textes.repositionner(projection);
  });

  // Le feutre et la gomme suivent l'appui maintenu ; le coloriage et le texte
  // agissent sur un appui simple, et le placement d'un point suspend tout.
  // Les textes ne deviennent déplaçables et modifiables que sous l'outil Texte :
  // sous le feutre, un appui dessine, il ne saisit pas un texte par mégarde.
  const outils = brancherLesOutilsDeCarte(scene.coloration, (outil) => {
    textes.definirLaModification(outil === OUTIL_TEXTE);
  });
  const enPause = () => placementEnCours() || !outilDeTrace(outils.outilActuel());
  brancherLaColoration(elementDeLaScene, scene.coloration, enPause);

  brancherLePlacement({
    scene: elementDeLaScene,
    bandeau: document.getElementById('bandeauDePlacement'),
    intitule: document.getElementById('intituleDuPlacement'),
    boutonAnnuler: document.getElementById('annulerLePlacement'),
    laProjection: scene.laProjection,
  });

  brancherLesGestes({
    scene: elementDeLaScene,
    coloration: scene.coloration,
    textes,
    outils,
    laProjection: scene.laProjection,
    leContexteDeLaCarte: scene.leContexteDeLaCarte,
    signaler,
  });

  return { scene, points, textes, outils, signaler, elementDeLaScene, OUTIL_TEXTE };
};
