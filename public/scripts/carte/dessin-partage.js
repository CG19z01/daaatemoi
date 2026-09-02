// Coloriage partage : les traits attendent le bouton Sauvegarder avant de partir
// vers le serveur. Le dessin commun est charge au demarrage de la page.

const POINTS_PAR_ENVOI = 250;
const DUREE_DE_LA_CONFIRMATION = 2000;

let traitsEnAttente = [];
let attenteDeLaConfirmation = null;

// Un trait tres long est decoupe, avec un point commun pour eviter les ruptures.
export const decouper = (trait) => {
  if (trait.points.length <= POINTS_PAR_ENVOI) return [trait];
  const morceaux = [];
  for (let debut = 0; debut < trait.points.length - 1; debut += POINTS_PAR_ENVOI - 1) {
    morceaux.push({ ...trait, points: trait.points.slice(debut, debut + POINTS_PAR_ENVOI) });
  }
  return morceaux;
};

// L'appelant fournit ses fonctions d'appel : chaque experience a son dessin.
export const chargerLeDessin = async (recuperer) => {
  try {
    return await recuperer();
  } catch {
    // Sans le dessin commun, la carte reste utilisable.
    return [];
  }
};

const confirmer = (bouton) => {
  bouton.classList.add('est-enregistre');
  clearTimeout(attenteDeLaConfirmation);
  attenteDeLaConfirmation = setTimeout(() => {
    bouton.classList.remove('est-enregistre');
  }, DUREE_DE_LA_CONFIRMATION);
};

const signaler = (texte) => {
  const message = document.getElementById('messageCarte');
  message.textContent = texte;
  message.hidden = false;
  setTimeout(() => {
    message.hidden = true;
  }, DUREE_DE_LA_CONFIRMATION);
};

const enregistrer = async (bouton, envoyer) => {
  if (bouton.disabled) return;
  const aEnvoyer = traitsEnAttente;
  if (aEnvoyer.length === 0) return confirmer(bouton);
  bouton.disabled = true;
  bouton.textContent = 'Envoi...';
  try {
    for (const trait of aEnvoyer) {
      for (const morceau of decouper(trait)) await envoyer(morceau);
    }
    traitsEnAttente = traitsEnAttente.slice(aEnvoyer.length);
    confirmer(bouton);
  } catch {
    signaler('Le dessin n’a pas pu être enregistré. Réessaie.');
  } finally {
    bouton.disabled = false;
    bouton.textContent = 'Sauvegarder';
  }
};

export const brancherLeDessinPartage = (coloration, envoyer) => {
  coloration.surTraitTermine((trait) => traitsEnAttente.push(trait));
  const bouton = document.getElementById('boutonSauvegarder');
  bouton.addEventListener('click', () => enregistrer(bouton, envoyer));
};
