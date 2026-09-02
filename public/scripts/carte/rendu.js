// Rendu de la carte : le fond reel de la ville au trait, puis les batiments.
import { dessinerBatiment } from './batiments.js';
import { BLANC } from './trait.js';
import { dessinerLaSeine } from './seine.js';
import { dessinerLesParcs, dessinerLeReseauDeVoies } from './rendu-fond.js';
import { dessinerLeLittoral, dessinerLesPlansDEau } from './mer.js';

const dessinerLeSol = (contexte, largeur, hauteur) => {
  contexte.globalAlpha = 1;
  contexte.fillStyle = BLANC;
  contexte.fillRect(0, 0, largeur, hauteur);
};

const dessinerLesBatiments = (contexte, lesBatiments, projection, taille) => {
  for (const batiment of lesBatiments) {
    const base = projection.versEcranMetrique(batiment.x, batiment.y, 0);
    // On ignore ce qui sort de l'ecran pour garder un rendu rapide.
    if (base.x < -160 || base.x > taille.largeur + 160) continue;
    if (base.y < -260 || base.y > taille.hauteur + 160) continue;
    dessinerBatiment(contexte, batiment, projection);
  }
};

export const dessinerLaCarte = (contexte, fond, decor, projection, taille) => {
  contexte.clearRect(0, 0, taille.largeur, taille.hauteur);
  dessinerLeSol(contexte, taille.largeur, taille.hauteur);
  dessinerLesParcs(contexte, fond.parcs, projection);
  dessinerLesPlansDEau(contexte, fond.plansDEau, projection);
  dessinerLaSeine(contexte, fond.riviere, projection);
  dessinerLeLittoral(contexte, fond.littoral, projection);
  dessinerLeReseauDeVoies(contexte, fond, projection);
  dessinerLesBatiments(contexte, decor.lesBatiments, projection, taille);
};
