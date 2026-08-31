// Dessin du fond de carte reel : parcs et voies, au trait noir.
import { NOIR, BLANC } from './trait.js';

const ECART_DES_HACHURES = 14;
const LARGEUR_DES_VOIES_PRINCIPALES = 16;
const LARGEUR_DES_VOIES_SECONDAIRES = 7;

const suivreLaLigne = (contexte, points, projection) => {
  contexte.beginPath();
  points.forEach(([x, y], index) => {
    const position = projection.versEcranMetrique(x, y, 0);
    if (index === 0) contexte.moveTo(position.x, position.y);
    else contexte.lineTo(position.x, position.y);
  });
};

// Un parc : contour noir et hachures legeres, sans aucune couleur.
const dessinerUnParc = (contexte, parc, projection) => {
  const points = parc.map(([x, y]) => projection.versEcranMetrique(x, y, 0));
  contexte.save();
  suivreLaLigne(contexte, parc, projection);
  contexte.closePath();
  contexte.globalAlpha = 1;
  contexte.fillStyle = BLANC;
  contexte.fill();
  contexte.clip();
  contexte.strokeStyle = NOIR;
  contexte.lineWidth = 1;
  const abscisses = points.map((point) => point.x);
  const ordonnees = points.map((point) => point.y);
  const depart = Math.min(...abscisses) - (Math.max(...ordonnees) - Math.min(...ordonnees));
  for (let x = depart; x <= Math.max(...abscisses); x += ECART_DES_HACHURES) {
    contexte.beginPath();
    contexte.moveTo(x, Math.min(...ordonnees));
    contexte.lineTo(x + (Math.max(...ordonnees) - Math.min(...ordonnees)), Math.max(...ordonnees));
    contexte.stroke();
  }
  contexte.restore();
  suivreLaLigne(contexte, parc, projection);
  contexte.closePath();
  contexte.lineWidth = Math.max(1.2, projection.echelle * 2.2);
  contexte.strokeStyle = NOIR;
  contexte.stroke();
};

const dessinerLesVoies = (contexte, voies, largeurEnMetres, projection) => {
  contexte.globalAlpha = 1;
  contexte.strokeStyle = NOIR;
  contexte.lineCap = 'round';
  contexte.lineJoin = 'round';
  contexte.lineWidth = Math.max(0.8, largeurEnMetres * projection.echelle);
  for (const voie of voies) {
    suivreLaLigne(contexte, voie, projection);
    contexte.stroke();
  }
};

export const dessinerLesParcs = (contexte, parcs, projection) => {
  for (const parc of parcs) dessinerUnParc(contexte, parc, projection);
};

export const dessinerLeReseauDeVoies = (contexte, fond, projection) => {
  dessinerLesVoies(contexte, fond.voiesSecondaires, LARGEUR_DES_VOIES_SECONDAIRES, projection);
  dessinerLesVoies(contexte, fond.voiesPrincipales, LARGEUR_DES_VOIES_PRINCIPALES, projection);
};
