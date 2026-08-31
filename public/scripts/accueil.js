// Accueil : "Oui" puis "Non". Des que la souris survole le bouton "Non",
// il devient "Oui" et mene lui aussi vers la carte.
const boutonNon = document.getElementById('boutonNon');

let dejaTransforme = false;

const transformerEnOui = () => {
  if (dejaTransforme) return;
  dejaTransforme = true;
  boutonNon.textContent = 'Oui';
};

// Ordinateur : le survol suffit, le bouton change immediatement.
boutonNon.addEventListener('pointerenter', (evenement) => {
  if (evenement.pointerType === 'mouse') transformerEnOui();
});

// Mobile : le premier toucher transforme le bouton sans valider,
// le toucher suivant mene a la carte.
boutonNon.addEventListener(
  'touchstart',
  (evenement) => {
    if (dejaTransforme) return;
    evenement.preventDefault();
    transformerEnOui();
  },
  { passive: false },
);

boutonNon.addEventListener('click', () => {
  transformerEnOui();
  window.location.href = '/carte';
});
