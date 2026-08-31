// Reglages du trait : taille (boutons - et +) et couleur (roue chromatique).
import {
  COULEUR_PAR_DEFAUT,
  TAILLE_MINIMALE,
  TAILLE_MAXIMALE,
  TAILLE_PAR_DEFAUT,
  PAS_DE_TAILLE,
} from './coloration.js';

const APERCU_MINIMAL = 8;
const APERCU_MAXIMAL = 26;

// Diametre de l'apercu, proportionnel a la taille reelle du trait.
const diametreDeLApercu = (taille) => {
  const progression = (taille - TAILLE_MINIMALE) / (TAILLE_MAXIMALE - TAILLE_MINIMALE);
  return APERCU_MINIMAL + progression * (APERCU_MAXIMAL - APERCU_MINIMAL);
};

export const brancherLesReglagesDuTrait = (coloration) => {
  const boutonReduire = document.getElementById('boutonReduireLeTrait');
  const boutonAgrandir = document.getElementById('boutonAgrandirLeTrait');
  const champDeLaCouleur = document.getElementById('roueChromatique');
  const boutonDeLaCouleur = document.getElementById('boutonDeLaCouleur');
  const apercu = document.getElementById('apercuDuTrait');

  let tailleDuTrait = TAILLE_PAR_DEFAUT;
  let couleurDuFeutre = COULEUR_PAR_DEFAUT;

  const rafraichirLApercu = () => {
    const diametre = diametreDeLApercu(tailleDuTrait);
    apercu.style.width = `${diametre}px`;
    apercu.style.height = `${diametre}px`;
    apercu.style.backgroundColor = couleurDuFeutre;
    boutonDeLaCouleur.style.backgroundColor = couleurDuFeutre;
    apercu.setAttribute('aria-label', `Taille du trait : ${tailleDuTrait}`);
    boutonReduire.disabled = tailleDuTrait <= TAILLE_MINIMALE;
    boutonAgrandir.disabled = tailleDuTrait >= TAILLE_MAXIMALE;
  };

  const changerLaTaille = (variation) => {
    tailleDuTrait = coloration.definirLaTaille(tailleDuTrait + variation);
    rafraichirLApercu();
  };

  boutonReduire.addEventListener('click', () => changerLaTaille(-PAS_DE_TAILLE));
  boutonAgrandir.addEventListener('click', () => changerLaTaille(PAS_DE_TAILLE));

  // Le bouton ouvre la palette native du navigateur.
  boutonDeLaCouleur.addEventListener('click', () => {
    if (typeof champDeLaCouleur.showPicker === 'function') champDeLaCouleur.showPicker();
    else champDeLaCouleur.click();
  });

  // La nouvelle couleur s'applique des le trait suivant.
  champDeLaCouleur.addEventListener('input', () => {
    couleurDuFeutre = champDeLaCouleur.value;
    coloration.definirLaCouleur(couleurDuFeutre);
    rafraichirLApercu();
  });

  coloration.definirLaCouleur(couleurDuFeutre);
  coloration.definirLaTaille(tailleDuTrait);
  rafraichirLApercu();
};
