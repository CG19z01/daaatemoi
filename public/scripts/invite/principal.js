// Orchestration de la page invitée : mot de passe, puis carte, outils, dates
// et lieux. Rien n'est chargé avant que le serveur ait ouvert l'accès.
import { chargerLesFenetresCommunes } from '../commun/fenetres-communes.js';
import { creerLAtelier } from '../commun/atelier-de-carte.js';
import { creerEnregistrementDiffere } from '../commun/enregistrement-differe.js';
import { brancherLeDessinPartage, chargerLeDessin } from '../carte/dessin-partage.js';
import { etat, surChangement, definirLExperience } from './etat.js';
import {
  chargerLExperience,
  recupererLaVille,
  chargerLeFondDeVille,
  recupererLeDessin,
  envoyerUnTrait,
  recupererLesTextes,
  enregistrerLesTextes,
} from './api.js';
import { brancherLaConnexion } from './connexion.js';
import { brancherLesDisponibilites } from './disponibilites.js';
import { brancherLesPropositions } from './propositions.js';
import { brancherLesLieux } from './lieux.js';
import { brancherLEnvoiDeLaReponse } from './reponse.js';

try {
  await chargerLesFenetresCommunes();
} catch {
  document.getElementById('messageDacces').textContent =
    'La page n’a pas pu se charger entièrement. Recharge-la.';
  throw new Error('Fenêtres communes indisponibles.');
}

// Les textes partent d'eux-mêmes, une fois le geste terminé ; le dessin, lui,
// attend le bouton Sauvegarder.
let atelier = null;
const enregistrerLesTextesPlusTard = creerEnregistrementDiffere(async () => {
  try {
    await enregistrerLesTextes(atelier.textes.liste());
  } catch {
    atelier.signaler('Le texte n’a pas pu être enregistré. Réessaie.');
  }
});

atelier = creerLAtelier({ auxTextesModifies: () => enregistrerLesTextesPlusTard() });
brancherLeDessinPartage(atelier.scene.coloration, envoyerUnTrait);

surChangement(() => {
  atelier.points.definir(etat.experience?.lieux ?? []);
  const projection = atelier.scene.laProjection();
  if (projection) atelier.points.repositionner(projection);
});

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

// La carte s'affiche avant même le mot de passe : l'écran de saisie se pose
// par-dessus et intercepte tous les gestes. Rien du contenu de l'expérience
// n'est chargé à ce stade.
let villeAffichee = null;

const afficherLaVille = async (ville) => {
  if (villeAffichee === ville.cle) return;
  atelier.scene.definirLaVille(await chargerLeFondDeVille(ville.cle));
  villeAffichee = ville.cle;
};

const preparerLeFond = async () => {
  try {
    const ville = await recupererLaVille();
    document.getElementById('titreDuPanneau').textContent = `Un date à ${ville.nom}`;
    await afficherLaVille(ville);
  } catch {
    // Sans la carte de fond, l'écran de mot de passe reste parfaitement utilisable.
  }
};

const demarrer = async () => {
  const experience = await chargerLExperience();
  definirLExperience(experience);
  document.getElementById('titreDuPanneau').textContent = `Un date à ${experience.ville.nom}`;
  document.getElementById('cadreDeLExperience').hidden = false;
  await afficherLaVille(experience.ville);
  atelier.scene.coloration.ajouterDesTraits(await chargerLeDessin(recupererLeDessin));
  atelier.textes.definir(await recupererLesTextes());
  atelier.textes.repositionner(atelier.scene.laProjection());
};

brancherLesDisponibilites();
brancherLesPropositions();
brancherLesLieux();
brancherLEnvoiDeLaReponse();
brancherLePanneau();
brancherLaConnexion(demarrer);
preparerLeFond();
