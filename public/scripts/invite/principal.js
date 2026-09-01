// Orchestration de la page invitee : mot de passe, puis carte, dessin, dates
// et lieux. Rien n'est charge avant que le serveur ait ouvert l'acces.
import { creerLaScene } from '../commun/scene-de-carte.js';
import { chargerLesFenetresCommunes } from '../commun/fenetres-communes.js';
import { creerLesPointsDeLieux } from '../commun/points-de-lieux.js';
import { brancherLePlacement, placementEnCours } from '../commun/placement-de-point.js';
import { brancherLaColoration } from '../carte/interactions.js';
import { brancherLesOutils } from '../carte/outils.js';
import { brancherLeDessinPartage, chargerLeDessin } from '../carte/dessin-partage.js';
import { etat, surChangement, definirLExperience } from './etat.js';
import { chargerLExperience, chargerLeFondDeVille, recupererLeDessin, envoyerUnTrait } from './api.js';
import { brancherLaConnexion } from './connexion.js';
import { brancherLesDisponibilites } from './disponibilites.js';
import { brancherLesPropositions } from './propositions.js';
import { brancherLesLieux } from './lieux.js';
import { brancherLEnvoiDeLaReponse } from './reponse.js';

const elementDeLaScene = document.getElementById('scene');
const scene = creerLaScene({
  scene: elementDeLaScene,
  canvasCarte: document.getElementById('canvasCarte'),
  canvasColoration: document.getElementById('canvasColoration'),
});

const points = creerLesPointsDeLieux(document.getElementById('coucheMarqueurs'));
scene.surRedimensionnement((projection) => points.repositionner(projection));

// Le dessin demande un appui maintenu, et se suspend pendant un placement.
// Il est branche avant le placement : les deux ecoutent le meme appui, et le
// dessin doit pouvoir constater que le placement est encore en cours.
brancherLaColoration(elementDeLaScene, scene.coloration, placementEnCours);

brancherLePlacement({
  scene: elementDeLaScene,
  bandeau: document.getElementById('bandeauDePlacement'),
  intitule: document.getElementById('intituleDuPlacement'),
  boutonAnnuler: document.getElementById('annulerLePlacement'),
  laProjection: scene.laProjection,
});

brancherLesOutils(scene.coloration);
brancherLeDessinPartage(scene.coloration, envoyerUnTrait);

surChangement(() => {
  points.definir(etat.experience?.lieux ?? []);
  const projection = scene.laProjection();
  if (projection) points.repositionner(projection);
});

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

const demarrer = async () => {
  const experience = await chargerLExperience();
  definirLExperience(experience);
  document.getElementById('titreDuPanneau').textContent = `Un date à ${experience.ville.nom}`;
  document.getElementById('cadreDeLExperience').hidden = false;
  scene.definirLaVille(await chargerLeFondDeVille(experience.ville.cle), experience.ville);
  scene.coloration.ajouterDesTraits(await chargerLeDessin(recupererLeDessin));
};

brancherLesDisponibilites();
brancherLesPropositions();
brancherLesLieux();
brancherLEnvoiDeLaReponse();
brancherLePanneau();
brancherLaConnexion(demarrer);
chargerLesFenetresCommunes().catch(() => {
  document.getElementById('messageDacces').textContent =
    'La page n’est pas complètement chargée. Recharge-la.';
});
