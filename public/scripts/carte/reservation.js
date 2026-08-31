// Fenetre de reservation : lieu, date et heure, validees ensuite par le serveur.
import { envoyerLaReservation } from './api.js';

const MESSAGE_SANS_LIEU = 'Aucun lieu n’est disponible pour le moment.';

const fenetre = document.getElementById('fenetreReservation');
const formulaire = document.getElementById('formulaireReservation');
const champLieu = document.getElementById('champLieu');
const champDate = document.getElementById('champDate');
const champHeure = document.getElementById('champHeure');
const message = document.getElementById('messageReservation');
const boutonValider = formulaire.querySelector('button[type="submit"]');

let aucunLieuDisponible = true;

const remplirLaListeDesLieux = (listeDesLieux) => {
  champLieu.replaceChildren();
  if (listeDesLieux.length === 0) {
    const option = document.createElement('option');
    option.textContent = MESSAGE_SANS_LIEU;
    champLieu.append(option);
    return;
  }
  for (const lieu of listeDesLieux) {
    const option = document.createElement('option');
    option.value = lieu.identifiant;
    option.textContent = lieu.nom;
    champLieu.append(option);
  }
};

export const preparerLaReservation = (listeDesLieux) => {
  aucunLieuDisponible = listeDesLieux.length === 0;
  remplirLaListeDesLieux(listeDesLieux);
  champLieu.disabled = aucunLieuDisponible;
  boutonValider.disabled = aucunLieuDisponible;

  document.getElementById('annulerReservation').addEventListener('click', () => fenetre.close());

  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    if (aucunLieuDisponible || boutonValider.disabled) return;
    // Neutralise le temps de l'envoi : un double clic ne part pas deux fois.
    boutonValider.disabled = true;
    message.textContent = 'Envoi en cours...';
    try {
      const reponse = await envoyerLaReservation({
        identifiantDuLieu: champLieu.value,
        dateDeReservation: champDate.value,
        heureDeReservation: champHeure.value,
      });
      message.textContent = reponse.message;
    } catch (erreur) {
      message.textContent = erreur.message;
    } finally {
      boutonValider.disabled = aucunLieuDisponible;
    }
  });
};

// Ouvre la fenetre en preremplissant le lieu deja selectionne sur la carte.
export const ouvrirLaReservation = (lieuSelectionne) => {
  if (lieuSelectionne) champLieu.value = lieuSelectionne.identifiant;
  message.textContent = aucunLieuDisponible ? MESSAGE_SANS_LIEU : '';
  fenetre.showModal();
};
