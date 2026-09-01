// Fenêtre d'édition d'une zone de texte : le contenu, sa couleur et sa taille.
// Volontairement minimale — ce n'est pas un traitement de texte.
// Les réglages sont propres au texte et ne touchent jamais à ceux du feutre.
const TAILLE_MINIMALE = 10;
const TAILLE_MAXIMALE = 64;

let elements = null;
let texteEnCours = null;
let auResultat = null;

const preparerLaFenetre = () => {
  if (elements) return;
  elements = {
    fenetre: document.getElementById('fenetreDuTexte'),
    formulaire: document.getElementById('formulaireDuTexte'),
    contenu: document.getElementById('champDuTexte'),
    couleur: document.getElementById('champCouleurDuTexte'),
    bouton: document.getElementById('boutonCouleurDuTexte'),
    taille: document.getElementById('champTailleDuTexte'),
  };

  const afficherLaCouleur = () => {
    elements.bouton.style.backgroundColor = elements.couleur.value;
  };
  elements.bouton.addEventListener('click', () => {
    if (typeof elements.couleur.showPicker === 'function') elements.couleur.showPicker();
    else elements.couleur.click();
  });
  elements.couleur.addEventListener('input', afficherLaCouleur);

  document.getElementById('annulerLeTexte').addEventListener('click', () => {
    elements.fenetre.close();
    auResultat?.({ action: 'annuler', texte: texteEnCours });
  });

  document.getElementById('supprimerLeTexte').addEventListener('click', () => {
    elements.fenetre.close();
    auResultat?.({ action: 'supprimer', texte: texteEnCours });
  });

  elements.formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    const contenu = elements.contenu.value.trim();
    elements.fenetre.close();
    // Un texte vidé est retiré : c'est le geste le plus naturel.
    if (contenu.length === 0) {
      auResultat?.({ action: 'supprimer', texte: texteEnCours });
      return;
    }
    Object.assign(texteEnCours, {
      contenu,
      couleur: elements.couleur.value,
      taille: Math.min(TAILLE_MAXIMALE, Math.max(TAILLE_MINIMALE, Number(elements.taille.value))),
    });
    auResultat?.({ action: 'enregistrer', texte: texteEnCours });
  });
};

// Ouvre l'édition. Le rappel reçoit { action, texte } :
// « enregistrer », « supprimer » ou « annuler ».
export const ouvrirLEditionDuTexte = (texte, rappel) => {
  preparerLaFenetre();
  texteEnCours = texte;
  auResultat = rappel;
  elements.contenu.value = texte.contenu;
  elements.couleur.value = texte.couleur;
  elements.bouton.style.backgroundColor = texte.couleur;
  elements.taille.value = String(texte.taille);
  elements.fenetre.showModal();
  elements.contenu.focus();
};
