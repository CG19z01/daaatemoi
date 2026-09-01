// La mer et les plans d'eau, au trait comme le reste de la carte.
//
// Le trait de côte reçoit des lignes d'écume parallèles, du côté de l'eau :
// c'est ce qui distingue immédiatement une ville côtière d'une ville de
// l'intérieur, sans ajouter la moindre couleur.
import { NOIR, BLANC } from './trait.js';
import { decalerVersLEau } from './cote.js';

// Écartement des lignes d'écume, en mètres : elles suivent donc le zoom.
const ECUMES = [55, 120, 200];
const ECART_DES_VAGUES = 90;
const LONGUEUR_DE_LA_VAGUE = 55;

const suivre = (contexte, points, projection) => {
  contexte.beginPath();
  points.forEach(([x, y], rang) => {
    const position = projection.versEcranMetrique(x, y, 0);
    if (rang === 0) contexte.moveTo(position.x, position.y);
    else contexte.lineTo(position.x, position.y);
  });
};

export const dessinerLeLittoral = (contexte, littoral, projection) => {
  if (littoral.length === 0) return;
  contexte.globalAlpha = 1;
  contexte.strokeStyle = NOIR;
  contexte.lineCap = 'round';
  contexte.lineJoin = 'round';

  // L'écume d'abord, en trait fin, puis le trait de côte franc par-dessus.
  for (const [rang, distance] of ECUMES.entries()) {
    contexte.lineWidth = Math.max(0.8, projection.echelle * (5 - rang));
    for (const trace of littoral) {
      suivre(contexte, decalerVersLEau(trace, distance), projection);
      contexte.stroke();
    }
  }

  contexte.lineWidth = Math.max(2, projection.echelle * 9);
  for (const trace of littoral) {
    suivre(contexte, trace, projection);
    contexte.stroke();
  }
};

// Petites vagues horizontales à l'intérieur d'une étendue d'eau fermée.
const hachurerDesVagues = (contexte, points, projection) => {
  const ecran = points.map(([x, y]) => projection.versEcranMetrique(x, y, 0));
  const abscisses = ecran.map((position) => position.x);
  const ordonnees = ecran.map((position) => position.y);
  const pas = Math.max(6, ECART_DES_VAGUES * projection.echelle);
  const longueur = Math.max(4, LONGUEUR_DE_LA_VAGUE * projection.echelle);

  contexte.lineWidth = 1.2;
  contexte.strokeStyle = NOIR;
  for (let y = Math.min(...ordonnees); y <= Math.max(...ordonnees); y += pas) {
    for (let x = Math.min(...abscisses); x <= Math.max(...abscisses); x += pas * 2) {
      contexte.beginPath();
      contexte.moveTo(x, y);
      // Un léger creux au milieu : le trait se lit comme une vague.
      contexte.quadraticCurveTo(x + longueur / 2, y + longueur / 3, x + longueur, y);
      contexte.stroke();
    }
  }
};

export const dessinerLesPlansDEau = (contexte, plansDEau, projection) => {
  for (const plan of plansDEau) {
    contexte.save();
    suivre(contexte, plan, projection);
    contexte.closePath();
    contexte.globalAlpha = 1;
    contexte.fillStyle = BLANC;
    contexte.fill();
    contexte.clip();
    hachurerDesVagues(contexte, plan, projection);
    contexte.restore();

    suivre(contexte, plan, projection);
    contexte.closePath();
    contexte.lineWidth = Math.max(1.4, projection.echelle * 3);
    contexte.strokeStyle = NOIR;
    contexte.stroke();
  }
};
