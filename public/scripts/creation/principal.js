// Orchestration de la page de creation : la carte, le panneau et les etapes.
import { creerLaScene } from '../commun/scene-de-carte.js';
import { chargerLesFenetresCommunes } from '../commun/fenetres-communes.js';
import { creerLesPointsDeLieux } from '../commun/points-de-lieux.js';
import { brancherLePlacement } from '../commun/placement-de-point.js';
import { etat, surChangement } from './etat.js';
import { brancherLaVille } from './ville.js';
import { brancherLePanneauDesLieux } from './panneau-lieux.js';
import { brancherLesDisponibilites } from './disponibilites.js';
import { brancherLaPublication } from './publication.js';

const scene = creerLaScene({
  scene: document.getElementById('scene'),
  canvasCarte: document.getElementById('canvasCarte'),
  canvasColoration: document.getElementById('canvasColoration'),
});

const points = creerLesPointsDeLieux(document.getElementById('coucheMarqueurs'));
scene.surRedimensionnement((projection) => points.repositionner(projection));

brancherLePlacement({
  scene: document.getElementById('scene'),
  bandeau: document.getElementById('bandeauDePlacement'),
  intitule: document.getElementById('intituleDuPlacement'),
  boutonAnnuler: document.getElementById('annulerLePlacement'),
  laProjection: scene.laProjection,
});

// Le panneau se replie sur les petits ecrans, pour laisser voir la carte.
const brancherLePanneau = () => {
  const panneau = document.getElementById('panneau');
  const bouton = document.getElementById('boutonDuPanneau');
  bouton.addEventListener('click', () => {
    const replie = panneau.classList.toggle('est-replie');
    bouton.setAttribute('aria-expanded', String(!replie));
    bouton.textContent = replie ? 'Ouvrir le panneau' : 'Voir la carte';
    scene.redimensionner();
  });
};

// Les etapes suivantes n'apparaissent qu'une fois la ville choisie.
const afficherLesEtapes = () => {
  const villeChoisie = Boolean(etat.ville);
  document.getElementById('etapeLieux').hidden = !villeChoisie;
  document.getElementById('etapeDisponibilites').hidden = !villeChoisie;
  document.getElementById('etapePartage').hidden = !villeChoisie;
};

surChangement(() => {
  afficherLesEtapes();
  points.definir(etat.lieux);
  const projection = scene.laProjection();
  if (projection) points.repositionner(projection);
});

brancherLaVille(scene);
brancherLePanneauDesLieux();
brancherLesDisponibilites();
brancherLaPublication();
brancherLePanneau();
afficherLesEtapes();

// Les fenetres partagees sont inserees avant toute interaction possible.
chargerLesFenetresCommunes().catch(() => {
  document.getElementById('messageVille').textContent =
    'La page n’est pas complètement chargée. Recharge-la.';
});
