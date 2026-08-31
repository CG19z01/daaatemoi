// Feutre et gomme. Les traits sont retenus en coordonnees de carte (metres),
// ce qui les rend independants de la taille d'ecran et de l'orientation.
export const COULEUR_PAR_DEFAUT = '#a30dad';
export const TAILLE_MINIMALE = 6;
export const TAILLE_MAXIMALE = 78;
export const TAILLE_PAR_DEFAUT = 30;
export const PAS_DE_TAILLE = 8;

export const MODE_FEUTRE = 'feutre';
export const MODE_GOMME = 'gomme';

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

  const preparerLOutil = (trait) => {
    contexte.globalAlpha = 1;
    contexte.globalCompositeOperation =
      trait.mode === MODE_GOMME ? 'destination-out' : 'source-over';
    contexte.strokeStyle = trait.couleur;
    contexte.lineWidth = Math.max(1, trait.tailleEnMetres * projection.echelle);
    contexte.lineCap = 'round';
    contexte.lineJoin = 'round';
  };

  const tracer = (trait) => {
    if (!projection || trait.points.length === 0) return;
    preparerLOutil(trait);
    contexte.beginPath();
    trait.points.forEach(([x, y], index) => {
      const position = projection.versEcranMetrique(x, y, 0);
      if (index === 0) contexte.moveTo(position.x, position.y);
      else contexte.lineTo(position.x, position.y);
    });
    contexte.stroke();
  };

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

  return {
    ajouterPoint,
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
