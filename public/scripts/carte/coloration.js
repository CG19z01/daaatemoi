// Feutre et gomme. Les traits sont retenus en coordonnees de carte (metres),
// ce qui les rend independants de la taille d'ecran et de l'orientation.
import {
  COULEUR_PAR_DEFAUT,
  TAILLE_MINIMALE,
  TAILLE_MAXIMALE,
  TAILLE_PAR_DEFAUT,
  MODE_FEUTRE,
  MODE_GOMME,
} from './reglages-du-feutre.js';
import { tracerUnTrait } from './traceur.js';

// Les réglages restent accessibles depuis ce module, comme avant.
export * from './reglages-du-feutre.js';

const EXPRESSION_COULEUR = /^#[0-9a-f]{6}$/i;
// En dessous de cette distance, un point n'apporte rien au trace.
const ECART_MINIMAL_EN_METRES = 3;

export const creerColoration = (canvas) => {
  const contexte = canvas.getContext('2d', { alpha: true });
  let projection = null;
  let tailleAffichee = { largeur: 0, hauteur: 0 };
  let modeActuel = MODE_FEUTRE;
  let couleurDuFeutre = COULEUR_PAR_DEFAUT;
  let tailleDuTrait = TAILLE_PAR_DEFAUT;
  let traits = [];
  let traitEnCours = null;
  let auTraitTermine = null;
  let auRemplissage = null;

  const tracer = (trait) => tracerUnTrait(contexte, trait, projection, auRemplissage);

  // Tout est redessine depuis les metres : net a n'importe quelle echelle.
  const rejouer = () => {
    contexte.clearRect(0, 0, tailleAffichee.largeur, tailleAffichee.hauteur);
    for (const trait of traits) tracer(trait);
    if (traitEnCours) tracer(traitEnCours);
  };

  const ajouterPoint = (positionX, positionY) => {
    if (!projection) return;
    const enMetres = projection.versMetriqueDepuisEcran(positionX, positionY);
    if (!traitEnCours) {
      traitEnCours = {
        mode: modeActuel,
        couleur: couleurDuFeutre,
        tailleEnMetres: tailleDuTrait / projection.echelle,
        points: [],
      };
    }
    const dernier = traitEnCours.points[traitEnCours.points.length - 1];
    if (dernier && Math.hypot(enMetres.x - dernier[0], enMetres.y - dernier[1]) < ECART_MINIMAL_EN_METRES) {
      return;
    }
    traitEnCours.points.push([Math.round(enMetres.x), Math.round(enMetres.y)]);
    tracer({ ...traitEnCours, points: traitEnCours.points.slice(-2) });
  };

  const interrompreLeTrait = () => {
    if (!traitEnCours) return;
    const termine = traitEnCours;
    traitEnCours = null;
    if (termine.points.length === 0) return;
    traits.push(termine);
    auTraitTermine?.(termine);
  };

  const ajouterDesTraits = (nouveaux) => {
    traits = [...traits, ...nouveaux];
    rejouer();
  };

  // Changer de ville rend les traits caduques : ils etaient poses sur une autre
  // carte, et leurs metres ne veulent plus rien dire ici.
  const effacerLesTraits = () => {
    interrompreLeTrait();
    traits = [];
    rejouer();
  };

  const definirLeMode = (nouveauMode) => {
    interrompreLeTrait();
    modeActuel = nouveauMode === MODE_GOMME ? MODE_GOMME : MODE_FEUTRE;
  };

  const definirLaCouleur = (couleur) => {
    interrompreLeTrait();
    if (EXPRESSION_COULEUR.test(couleur)) couleurDuFeutre = couleur;
  };

  const definirLaTaille = (taille) => {
    interrompreLeTrait();
    if (!Number.isFinite(taille)) return tailleDuTrait;
    tailleDuTrait = Math.min(TAILLE_MAXIMALE, Math.max(TAILLE_MINIMALE, taille));
    return tailleDuTrait;
  };

  const redimensionner = (largeur, hauteur, ratioDePixels, nouvelleProjection) => {
    canvas.width = Math.round(largeur * ratioDePixels);
    canvas.height = Math.round(hauteur * ratioDePixels);
    contexte.setTransform(ratioDePixels, 0, 0, ratioDePixels, 0, 0);
    tailleAffichee = { largeur, hauteur };
    projection = nouvelleProjection;
    rejouer();
  };

  // Un remplissage termine rejoint le dessin comme n'importe quel trait.
  const ajouterUnRemplissage = (trait) => {
    traits.push(trait);
    tracer(trait);
    auTraitTermine?.(trait);
  };

  return {
    ajouterPoint,
    ajouterUnRemplissage,
    effacerLesTraits,
    // Le remplissage peint directement sur cette couche.
    leContexte: () => contexte,
    definirLeRemplissage: (fonction) => {
      auRemplissage = fonction;
    },
    interrompreLeTrait,
    definirLeMode,
    definirLaCouleur,
    definirLaTaille,
    ajouterDesTraits,
    redimensionner,
    surTraitTermine: (rappel) => {
      auTraitTermine = rappel;
    },
  };
};
