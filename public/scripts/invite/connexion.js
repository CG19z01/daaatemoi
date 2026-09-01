// Ecran d'acces : le mot de passe est verifie par le serveur, jamais ici.
// Le message reste volontairement vague, comme la reponse du serveur.
import { seConnecter } from './api.js';

export const brancherLaConnexion = (auSucces) => {
  const ecran = document.getElementById('ecranDacces');
  const formulaire = document.getElementById('formulaireDacces');
  const champ = document.getElementById('champDuMotDePasse');
  const message = document.getElementById('messageDacces');
  const bouton = document.getElementById('validerLacces');

  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    bouton.disabled = true;
    message.textContent = 'Vérification…';
    try {
      await seConnecter(champ.value);
      // Le mot de passe ne reste pas en memoire de la page une fois utilise.
      champ.value = '';
      message.textContent = '';
      ecran.hidden = true;
      await auSucces();
    } catch (erreur) {
      message.textContent = erreur.message;
    } finally {
      bouton.disabled = false;
    }
  });
};
