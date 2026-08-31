// Barre d'outils : bascule entre le feutre et la gomme, puis reglages du trait.
import { MODE_FEUTRE, MODE_GOMME } from './coloration.js';
import { brancherLesReglagesDuTrait } from './reglages-du-trait.js';

export const brancherLesOutils = (coloration) => {
  const boutonFeutre = document.getElementById('boutonFeutre');
  const boutonGomme = document.getElementById('boutonGomme');

  const afficherLeModeActif = (mode) => {
    const enModeGomme = mode === MODE_GOMME;
    boutonFeutre.classList.toggle('est-actif', !enModeGomme);
    boutonGomme.classList.toggle('est-actif', enModeGomme);
    boutonFeutre.setAttribute('aria-pressed', String(!enModeGomme));
    boutonGomme.setAttribute('aria-pressed', String(enModeGomme));
  };

  const choisirLeMode = (mode) => {
    coloration.definirLeMode(mode);
    afficherLeModeActif(mode);
  };

  boutonFeutre.addEventListener('click', () => choisirLeMode(MODE_FEUTRE));
  boutonGomme.addEventListener('click', () => choisirLeMode(MODE_GOMME));
  afficherLeModeActif(MODE_FEUTRE);
  brancherLesReglagesDuTrait(coloration);
};
