// Premiere etape : la ville. Le serveur la localise puis genere son fond de
// carte, dans le style cartoon au trait du site.
import { preparerLaVille, chargerLeFondDeVille } from './api.js';
import { etat, definirLaVille, reinitialiserLesPlacements } from './etat.js';

// Un dessin, un texte ou un point n'ont de sens que sur la carte ou ils ont ete
// poses : leurs metres designeraient n'importe quoi sur une autre ville. Tout
// repart donc de zero, et on le dit clairement plutot que de le faire en douce.
const repartirDeZero = (atelier) => {
  atelier.textes.definir([]);
  reinitialiserLesPlacements();
  atelier.signaler('Nouvelle ville : le dessin et les points sont à refaire.');
};

export const brancherLaVille = (atelier) => {
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
      const changementDeVille = Boolean(etat.ville) && etat.ville.cle !== ville.cle;
      const fond = await chargerLeFondDeVille(ville.cle);
      atelier.scene.definirLaVille(fond);
      definirLaVille(ville);
      if (changementDeVille) repartirDeZero(atelier);
      indication.hidden = true;
      message.textContent = [ville.nom, ville.pays].filter(Boolean).join(', ');
    } catch (erreur) {
      message.textContent = erreur.message;
    } finally {
      bouton.disabled = false;
    }
  });
};
