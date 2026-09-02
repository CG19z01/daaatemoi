// Premiere etape : la ville. Le serveur la localise puis genere son fond de
// carte, dans le style cartoon au trait du site.
import { preparerLaVille, chargerLeFondDeVille } from './api.js';
import { definirLaVille } from './etat.js';

export const brancherLaVille = (scene) => {
  const formulaire = document.getElementById('formulaireVille');
  const champ = document.getElementById('champVille');
  const bouton = document.getElementById('boutonVille');
  const message = document.getElementById('messageVille');
  const indication = document.getElementById('carteVide');

  formulaire.addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const demande = champ.value.trim();
    if (demande.length < 2) {
      message.textContent = 'Écris le nom d’une ville.';
      return;
    }

    bouton.disabled = true;
    // La generation interroge OpenStreetMap : cela prend quelques secondes.
    message.textContent = 'Je dessine la carte…';
    try {
      const ville = await preparerLaVille(demande);
      const fond = await chargerLeFondDeVille(ville.cle);
      scene.definirLaVille(fond, ville);
      definirLaVille(ville);
      indication.hidden = true;
      message.textContent = [ville.nom, ville.pays].filter(Boolean).join(', ');
    } catch (erreur) {
      message.textContent = erreur.message;
    } finally {
      bouton.disabled = false;
    }
  });
};
