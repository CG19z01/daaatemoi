// Derniere etape : mot de passe puis partage du lien. Le mot de passe part une
// seule fois vers le serveur, qui le hache ; il n'est jamais conserve ici.
import { etat, surChangement, composerLEnvoi } from './etat.js';
import { publierLExperience } from './api.js';
import { brancherLeBoutonDeCopie } from '../commun/copier-lien.js';

const LONGUEUR_MINIMALE_DU_MOT_DE_PASSE = 8;

export const brancherLaPublication = () => {
  const boutonPartager = document.getElementById('boutonPartager');
  const fenetre = document.getElementById('fenetreDuMotDePasse');
  const formulaire = document.getElementById('formulaireDuMotDePasse');
  const champ = document.getElementById('champMotDePasse');
  const confirmation = document.getElementById('champConfirmation');
  const message = document.getElementById('messageDuMotDePasse');
  const valider = document.getElementById('validerLeMotDePasse');
  const fenetreDuLien = document.getElementById('fenetreDuLien');
  const champDuLien = document.getElementById('champDuLien');
  const lienDirect = document.getElementById('lienDirect');

  const oublierLeMotDePasse = () => {
    champ.value = '';
    confirmation.value = '';
  };

  const premiereErreur = () => {
    if (champ.value.length < LONGUEUR_MINIMALE_DU_MOT_DE_PASSE) {
      return `Le mot de passe fait au moins ${LONGUEUR_MINIMALE_DU_MOT_DE_PASSE} caractères.`;
    }
    if (champ.value !== confirmation.value) return 'Les deux mots de passe ne correspondent pas.';
    return null;
  };

  boutonPartager.addEventListener('click', () => {
    oublierLeMotDePasse();
    message.textContent = '';
    fenetre.showModal();
  });
  document.getElementById('annulerLeMotDePasse').addEventListener('click', () => {
    oublierLeMotDePasse();
    fenetre.close();
  });

  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const erreur = premiereErreur();
    if (erreur) {
      message.textContent = erreur;
      return;
    }
    valider.disabled = true;
    message.textContent = 'Enregistrement…';
    try {
      const { lien } = await publierLExperience(composerLEnvoi(champ.value, confirmation.value));
      oublierLeMotDePasse();
      fenetre.close();
      champDuLien.value = lien;
      lienDirect.href = lien;
      fenetreDuLien.showModal();
    } catch (probleme) {
      message.textContent = probleme.message;
    } finally {
      valider.disabled = false;
    }
  });

  document.getElementById('fermerLeLien').addEventListener('click', () => fenetreDuLien.close());
  brancherLeBoutonDeCopie(document.getElementById('boutonCopierLeLien'), () => champDuLien.value);

  surChangement(() => {
    boutonPartager.disabled = !etat.ville;
  });
  boutonPartager.disabled = true;
};
