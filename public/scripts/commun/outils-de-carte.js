// Barre d'outils des cartes d'expérience : Feutre, Coloriage, Texte, Gomme.
// Les réglages de taille et de couleur sont ceux déjà en place sur la carte de
// Rouen — la roue chromatique sert au feutre et au coloriage, jamais aux points
// des lieux ni aux textes, qui ont leurs propres réglages.
import { MODE_FEUTRE, MODE_GOMME } from '../carte/coloration.js';
import { brancherLesReglagesDuTrait } from '../carte/reglages-du-trait.js';

export const OUTIL_FEUTRE = 'feutre';
export const OUTIL_COLORIAGE = 'coloriage';
export const OUTIL_TEXTE = 'texte';
export const OUTIL_GOMME = 'gomme';

const BOUTONS = [
  [OUTIL_FEUTRE, 'boutonFeutre'],
  [OUTIL_COLORIAGE, 'boutonColoriage'],
  [OUTIL_TEXTE, 'boutonTexte'],
  [OUTIL_GOMME, 'boutonGomme'],
];

// Seuls le feutre et la gomme suivent le geste ; les deux autres agissent
// sur un simple appui.
export const outilDeTrace = (outil) => outil === OUTIL_FEUTRE || outil === OUTIL_GOMME;

export const brancherLesOutilsDeCarte = (coloration, auChangementDOutil = null) => {
  const champDeLaCouleur = document.getElementById('roueChromatique');
  let outilActuel = OUTIL_FEUTRE;

  const boutons = BOUTONS.map(([outil, identifiant]) => ({
    outil,
    element: document.getElementById(identifiant),
  }));

  const afficherLOutilActif = () => {
    for (const { outil, element } of boutons) {
      element.classList.toggle('est-actif', outil === outilActuel);
      element.setAttribute('aria-pressed', String(outil === outilActuel));
    }
  };

  const choisir = (outil) => {
    outilActuel = outil;
    // La gomme reste un mode de tracé ; le coloriage et le texte n'en sont pas.
    coloration.definirLeMode(outil === OUTIL_GOMME ? MODE_GOMME : MODE_FEUTRE);
    afficherLOutilActif();
    auChangementDOutil?.(outil);
  };

  for (const { outil, element } of boutons) {
    element.addEventListener('click', () => choisir(outil));
  }

  brancherLesReglagesDuTrait(coloration);
  choisir(OUTIL_FEUTRE);

  return {
    outilActuel: () => outilActuel,
    couleurActuelle: () => champDeLaCouleur.value,
  };
};
