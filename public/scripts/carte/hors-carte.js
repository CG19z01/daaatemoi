// Les abords de la carte : tout ce que l'écran montre au-delà des données.
//
// La projection cadre la ville entière, donc l'écran déborde presque toujours
// de la zone extraite d'OpenStreetMap — d'autant plus que son format s'éloigne
// de celui de la ville. Sans traitement, ce débord restait blanc et donnait
// l'impression d'une carte inachevée.
//
// Rien n'y est inventé : on n'y dessine ni rue ni bâtiment, seulement une
// hachure régulière et un trait franc à la limite. Les abords se lisent alors
// comme une bordure voulue, dans le même noir et blanc que le reste.
import { NOIR } from './trait.js';

const ECART_DES_HACHURES = 15;
const EPAISSEUR_DE_LA_HACHURE = 1;
const EPAISSEUR_DE_LA_LIMITE = 3;

// Les quatre coins de la zone couverte par les données, vus à l'écran.
const coinsDeLaZone = (portee, projection) =>
  [[-portee, -portee], [portee, -portee], [portee, portee], [-portee, portee]].map(([x, y]) =>
    projection.versEcranMetrique(x, y, 0),
  );

const suivreLesCoins = (contexte, coins) => {
  contexte.moveTo(coins[0].x, coins[0].y);
  for (const coin of coins.slice(1)) contexte.lineTo(coin.x, coin.y);
  contexte.closePath();
};

// Hachures obliques couvrant toute la surface, du coin haut droit vers le bas.
const hachurer = (contexte, largeur, hauteur) => {
  contexte.globalAlpha = 1;
  contexte.strokeStyle = NOIR;
  contexte.lineWidth = EPAISSEUR_DE_LA_HACHURE;
  contexte.beginPath();
  for (let depart = -hauteur; depart <= largeur + hauteur; depart += ECART_DES_HACHURES) {
    contexte.moveTo(depart, 0);
    contexte.lineTo(depart + hauteur, hauteur);
  }
  contexte.stroke();
};

// Dessine les abords, puis souligne la limite de la carte d'un trait net.
// Sans données du tout — extraction en échec, ville vide — la hachure couvre
// alors tout l'écran : mieux vaut une carte visiblement vide qu'un canvas blanc
// qu'on croirait cassé.
export const dessinerLesAbords = (contexte, portee, projection, taille) => {
  if (!portee || !Number.isFinite(portee)) {
    contexte.save();
    hachurer(contexte, taille.largeur, taille.hauteur);
    contexte.restore();
    return;
  }
  const coins = coinsDeLaZone(portee, projection);

  contexte.save();
  // Règle pair-impair : la zone couverte devient un trou dans le rectangle de
  // l'écran, et la hachure ne mord donc jamais sur la ville.
  contexte.beginPath();
  contexte.rect(0, 0, taille.largeur, taille.hauteur);
  suivreLesCoins(contexte, coins);
  contexte.clip('evenodd');
  hachurer(contexte, taille.largeur, taille.hauteur);
  contexte.restore();

  contexte.globalAlpha = 1;
  contexte.strokeStyle = NOIR;
  contexte.lineWidth = EPAISSEUR_DE_LA_LIMITE;
  contexte.lineJoin = 'round';
  contexte.beginPath();
  suivreLesCoins(contexte, coins);
  contexte.stroke();
};
