// Génération des bâtiments dans les espaces réellement libres du fond de carte.
// Toute la terre se construit : les seuls endroits laissés vides sont l'eau —
// fleuve, mer, plans d'eau, quelle que soit leur taille — les voies, et les
// parcs, qui ont leur propre hachure.
import { creerAleatoire } from './hasard.js';
import { creerSelecteurDeBatiments } from './selection-batiments.js';
import { EMPREINTE_MAXIMALE } from './modeles-batiments.js';
import { creerGrilleDOccupation, estDansLePolygone } from './occupation.js';
import { creerTestDeLaMer } from './cote.js';

const MARGE_DANS_LA_CASE = 10;
const PAS_DE_LA_GRILLE = EMPREINTE_MAXIMALE + MARGE_DANS_LA_CASE;
// Portée par défaut : celle de la carte de Rouen. Une expérience sur une autre
// ville fournit la sienne, pour que les bâtiments couvrent toute la vue.
const LIMITE_PAR_DEFAUT = 3400;
const PAS_DE_L_OCCUPATION = 12;
const GRAINE = 20260825;
const RAYON_DES_VOIES_PRINCIPALES = 15;
const RAYON_DES_VOIES_SECONDAIRES = 9;
const MARGE_AUTOUR_DU_FLEUVE = 20;
const RAYON_AUTOUR_DES_LIEUX = 55;
// Le contour d'un plan d'eau est aussi marque comme une ligne : une mare plus
// etroite que le maillage passerait sinon entre les mailles.
const RAYON_AUTOUR_DE_L_EAU = 16;
// Jusqu'où s'étend la mer au large du trait de côte : au-delà de la carte.
const PROFONDEUR_DE_LA_MER = 14000;
// Plusieurs essais par case, et plusieurs modèles : une case qui refuse un
// immeuble accueille souvent une petite maison. La ville reste ainsi pleine.
const MODELES_ESSAYES = 3;
const POSITIONS_ESSAYEES = 4;

// Tout ce qui vient du fond de carte réel devient interdit à la construction.
const preparerLaGrille = (fond, positionsDesLieux, limiteDeLaVille) => {
  const grille = creerGrilleDOccupation(limiteDeLaVille + PAS_DE_LA_GRILLE, PAS_DE_L_OCCUPATION);
  for (const bras of fond.riviere) {
    grille.marquerUneLigne(bras.points, bras.largeur / 2 + MARGE_AUTOUR_DU_FLEUVE);
  }
  for (const voie of fond.voiesPrincipales) {
    grille.marquerUneLigne(voie, RAYON_DES_VOIES_PRINCIPALES);
  }
  for (const voie of fond.voiesSecondaires) {
    grille.marquerUneLigne(voie, RAYON_DES_VOIES_SECONDAIRES);
  }
  for (const parc of fond.parcs) grille.marquerUnPolygone(parc);
  for (const plan of fond.plansDEau) {
    grille.marquerUnPolygone(plan);
    grille.marquerUneLigne(plan, RAYON_AUTOUR_DE_L_EAU);
  }
  for (const trace of fond.littoral) grille.marquerUneLigne(trace, RAYON_AUTOUR_DE_L_EAU);
  // Un segment de longueur nulle marque simplement un disque autour du point.
  for (const lieu of positionsDesLieux) {
    grille.marquerUneLigne([[lieu.x, lieu.y], [lieu.x, lieu.y]], RAYON_AUTOUR_DES_LIEUX);
  }
  return grille;
};

// Renvoie un bâtiment posé dans la case, ou null si rien n'y tient.
// La position tirée est vérifiée elle-même : le centre de la case peut être à
// terre alors que le bâtiment, décalé, tomberait à l'eau.
const poserUnBatiment = (grille, choisirUnBatiment, aleatoire, x, y, aLEau) => {
  for (let modele = 0; modele < MODELES_ESSAYES; modele += 1) {
    const batiment = choisirUnBatiment();
    const placeLibreEnX = Math.max(0, PAS_DE_LA_GRILLE - MARGE_DANS_LA_CASE - batiment.largeur);
    const placeLibreEnY = Math.max(0, PAS_DE_LA_GRILLE - MARGE_DANS_LA_CASE - batiment.profondeur);
    for (let essai = 0; essai < POSITIONS_ESSAYEES; essai += 1) {
      const position = { x: x + aleatoire() * placeLibreEnX, y: y + aleatoire() * placeLibreEnY };
      if (aLEau(position.x, position.y)) continue;
      if (aLEau(position.x + batiment.largeur, position.y + batiment.profondeur)) continue;
      if (grille.emplacementLibre(position.x, position.y, batiment.largeur, batiment.profondeur)) {
        return { ...batiment, ...position };
      }
    }
  }
  return null;
};

export const construireDecor = (fond, positionsDesLieux = [], limiteDeLaVille = LIMITE_PAR_DEFAUT) => {
  const grille = preparerLaGrille(fond, positionsDesLieux, limiteDeLaVille);
  // La mer n'est pas décrite par une surface : seul son rivage l'est. On en
  // déduit le large. Les plans d'eau, eux, sont déjà interdits par la grille,
  // contour compris : inutile de les retester ici, ce serait bien plus lent.
  const auLarge = creerTestDeLaMer(fond.littoral, PROFONDEUR_DE_LA_MER);
  const aLEau = (x, y) => auLarge(x, y, estDansLePolygone);
  const aleatoire = creerAleatoire(GRAINE);
  const choisirUnBatiment = creerSelecteurDeBatiments(aleatoire);
  const lesBatiments = [];

  for (let x = -limiteDeLaVille; x <= limiteDeLaVille; x += PAS_DE_LA_GRILLE) {
    for (let y = -limiteDeLaVille; y <= limiteDeLaVille; y += PAS_DE_LA_GRILLE) {
      if (aLEau(x + PAS_DE_LA_GRILLE / 2, y + PAS_DE_LA_GRILLE / 2)) continue;
      const batiment = poserUnBatiment(grille, choisirUnBatiment, aleatoire, x, y, aLEau);
      if (batiment) lesBatiments.push(batiment);
    }
  }
  // Les bâtiments les plus lointains sont dessinés en premier.
  lesBatiments.sort((premier, second) => second.y - premier.y);
  return { lesBatiments };
};
