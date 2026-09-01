// Envoi de la reponse : la disponibilite retenue et les dates alternatives.
import { etat, surChangement } from './etat.js';
import { envoyerLaReponse } from './api.js';

export const brancherLEnvoiDeLaReponse = () => {
  const bouton = document.getElementById('boutonEnvoyerLaReponse');
  const message = document.getElementById('messageDeLaReponse');

  const rienAEnvoyer = () => etat.rangChoisi === null && etat.propositions.length === 0;

  bouton.addEventListener('click', async () => {
    if (rienAEnvoyer()) {
      message.textContent = 'Choisis une date proposée ou propose la tienne.';
      return;
    }
    bouton.disabled = true;
    message.textContent = 'Envoi…';
    try {
      const { message: confirmation } = await envoyerLaReponse({
        rangDeLaDisponibilite: etat.rangChoisi,
        propositions: etat.propositions,
      });
      message.textContent = confirmation;
    } catch (erreur) {
      message.textContent = erreur.message;
    } finally {
      bouton.disabled = rienAEnvoyer();
    }
  });

  surChangement(() => {
    bouton.disabled = rienAEnvoyer();
  });
};
