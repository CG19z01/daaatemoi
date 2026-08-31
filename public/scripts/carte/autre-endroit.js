// Proposition d'un autre lieu : verification immediate, envoi au serveur,
// puis confirmation. Le navigateur ne parle jamais au service de notification.
import { envoyerUneProposition } from './api.js';
import { demarrerLePlacement } from './placement.js';

const DUREE_DE_LA_CONFIRMATION = 2200;
const LONGUEUR_MINIMALE_DU_LIEU = 2;

const fenetre = document.getElementById('fenetreAutreEndroit');
const formulaire = document.getElementById('formulaireAutreEndroit');
const champLieu = document.getElementById('champLieuPropose');
const champDate = document.getElementById('champDateProposee');
const champHeure = document.getElementById('champHeureProposee');
const message = document.getElementById('messageProposition');
const boutonProposer = document.getElementById('boutonProposer');
const boutonPlacer = document.getElementById('boutonPlacerSurLaCarte');
const boutonCouleur = document.getElementById('boutonCouleurDuPoint');
const champCouleur = document.getElementById('champCouleurDuPoint');

// Position choisie sur la carte, facultative : sans elle la proposition reste valable.
let pointPlace = null;
let auPointRetenu = null;

// Meme exigences que le serveur, pour une reponse immediate au visiteur.
const premiereErreur = () => {
  if (champLieu.value.trim().length < LONGUEUR_MINIMALE_DU_LIEU) return 'Veuillez indiquer un lieu.';
  if (!champDate.value) return 'Veuillez sélectionner une date.';
  if (Number.isNaN(new Date(`${champDate.value}T12:00:00Z`).getTime())) {
    return 'Veuillez indiquer une date valide.';
  }
  if (!champHeure.value) return 'Veuillez sélectionner une heure.';
  return null;
};

const afficherLEnvoiEnCours = (enCours) => {
  boutonProposer.disabled = enCours;
  boutonProposer.textContent = enCours ? 'Envoi...' : 'Proposer';
};

const afficherLaCouleur = () => {
  boutonCouleur.style.backgroundColor = champCouleur.value;
};

const afficherLePointPlace = () => {
  boutonPlacer.textContent = pointPlace ? 'Point placé ✓ — replacer' : 'Placer sur la carte';
};

const reussir = (texte) => {
  message.textContent = texte;
  setTimeout(() => {
    fenetre.close();
    formulaire.reset();
    pointPlace = null;
    afficherLePointPlace();
    message.textContent = '';
  }, DUREE_DE_LA_CONFIRMATION);
};

const envoyer = async (evenement) => {
  evenement.preventDefault();
  if (boutonProposer.disabled) return;
  const erreur = premiereErreur();
  if (erreur) {
    message.textContent = erreur;
    return;
  }
  afficherLEnvoiEnCours(true);
  message.textContent = 'Envoi...';
  try {
    const reponse = await envoyerUneProposition({
      lieuPropose: champLieu.value,
      dateProposee: champDate.value,
      heureProposee: champHeure.value,
      couleur: champCouleur.value,
      ...(pointPlace ?? {}),
    });
    // Le point apparait aussitot sur la carte, sans recharger la page.
    if (reponse.lieuPropose) auPointRetenu?.(reponse.lieuPropose);
    reussir(reponse.message);
  } catch (probleme) {
    message.textContent = probleme.message;
  } finally {
    afficherLEnvoiEnCours(false);
  }
};

export const brancherLAutreEndroit = (auPointRetenuParLaCarte) => {
  auPointRetenu = auPointRetenuParLaCarte;
  document.getElementById('boutonAutreEndroit').addEventListener('click', () => {
    message.textContent = '';
    fenetre.showModal();
  });
  document.getElementById('annulerProposition').addEventListener('click', () => fenetre.close());

  // Le bouton ouvre la palette native, comme dans la barre d'outils.
  boutonCouleur.addEventListener('click', () => {
    if (typeof champCouleur.showPicker === 'function') champCouleur.showPicker();
    else champCouleur.click();
  });
  champCouleur.addEventListener('input', afficherLaCouleur);
  afficherLaCouleur();

  // Le formulaire s'efface le temps de viser, puis revient avec le point retenu.
  boutonPlacer.addEventListener('click', () => {
    fenetre.close();
    demarrerLePlacement((coordonnees) => {
      pointPlace = coordonnees;
      afficherLePointPlace();
      message.textContent = 'Point placé sur la carte.';
      fenetre.showModal();
    });
  });
  formulaire.addEventListener('submit', envoyer);
};
