// Orchestration de la page de création : la carte, ses outils, le panneau
// et les étapes.
import { chargerLesFenetresCommunes } from '../commun/fenetres-communes.js';
import { creerLAtelier } from '../commun/atelier-de-carte.js';
import { etat, surChangement } from './etat.js';
import { creerLeDepotDuDessin } from './depot-du-dessin.js';
import { brancherLaVille } from './ville.js';
import { brancherLePanneauDesLieux } from './panneau-lieux.js';
import { brancherLesDisponibilites } from './disponibilites.js';
import { brancherLaPublication } from './publication.js';

try {
  await chargerLesFenetresCommunes();
} catch {
  document.getElementById('messageVille').textContent =
    'La page n’a pas pu se charger entièrement. Recharge-la.';
  throw new Error('Fenêtres communes indisponibles.');
}

const atelier = creerLAtelier();
const depot = creerLeDepotDuDessin(atelier);

// Le panneau se replie sur les petits écrans, pour laisser voir la carte.
const brancherLePanneau = () => {
  const panneau = document.getElementById('panneau');
  const bouton = document.getElementById('boutonDuPanneau');
  bouton.addEventListener('click', () => {
    const replie = panneau.classList.toggle('est-replie');
    bouton.setAttribute('aria-expanded', String(!replie));
    bouton.textContent = replie ? 'Ouvrir le panneau' : 'Voir la carte';
    atelier.scene.redimensionner();
  });
};

// Les étapes suivantes n'apparaissent qu'une fois la ville choisie.
const afficherLesEtapes = () => {
  const villeChoisie = Boolean(etat.ville);
  for (const identifiant of ['etapeLieux', 'etapeDisponibilites', 'etapePartage']) {
    document.getElementById(identifiant).hidden = !villeChoisie;
  }
  document.body.classList.toggle('ville-choisie', villeChoisie);
};

surChangement(() => {
  afficherLesEtapes();
  atelier.points.definir(etat.lieux);
  const projection = atelier.scene.laProjection();
  if (projection) atelier.points.repositionner(projection);
});

brancherLaVille(atelier);
brancherLePanneauDesLieux();
brancherLesDisponibilites();
brancherLaPublication(depot);
brancherLePanneau();
afficherLesEtapes();
