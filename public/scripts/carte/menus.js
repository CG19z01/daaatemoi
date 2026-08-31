// Carte (menu) d'un lieu : image rangee dans le projet, lien externe, ou pas encore disponible.
const ADRESSE_AUTORISEE = /^https:\/\//i;

const bouton = document.getElementById('voirLaCarte');
const fenetre = document.getElementById('fenetreDeLaCarte');
const titre = document.getElementById('titreDeLaCarte');
const image = document.getElementById('imageDeLaCarte');

const menuDuLieu = (lieu) => lieu?.menu ?? null;

// Adapte le bouton de la fiche au lieu affiche.
export const preparerLeMenu = (lieu) => {
  const menu = menuDuLieu(lieu);
  const carteDisponible = menu?.type === 'lien' ? ADRESSE_AUTORISEE.test(menu.adresse) : Boolean(menu?.fichier);
  bouton.hidden = !menu;
  bouton.disabled = !carteDisponible;
  bouton.textContent = carteDisponible ? 'Voir la carte' : 'Carte bientôt disponible';
};

const ouvrirLeMenu = (lieu) => {
  const menu = menuDuLieu(lieu);
  if (!menu) return;
  if (menu.type === 'lien') {
    if (!ADRESSE_AUTORISEE.test(menu.adresse)) return;
    window.open(menu.adresse, '_blank', 'noopener,noreferrer');
    return;
  }
  if (!menu.fichier) return;
  titre.textContent = lieu.nom;
  image.src = `/cartes/${encodeURIComponent(menu.fichier)}`;
  image.alt = `Carte de ${lieu.nom}`;
  fenetre.showModal();
};

export const brancherLeMenu = (obtenirLeLieuSelectionne) => {
  bouton.addEventListener('click', () => ouvrirLeMenu(obtenirLeLieuSelectionne()));
  document.getElementById('fermerLaCarte').addEventListener('click', () => fenetre.close());
};
