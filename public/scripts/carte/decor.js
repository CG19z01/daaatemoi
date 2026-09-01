// Generation des batiments dans les espaces reellement libres du fond de carte :
// jamais sur le fleuve, jamais sur une voie, jamais dans un parc.
import { creerAleatoire } from './hasard.js';
import { creerSelecteurDeBatiments } from './selection-batiments.js';
import { EMPREINTE_MAXIMALE } from './modeles-batiments.js';
import { creerGrilleDOccupation } from './occupation.js';
import { decalerVersLEau } from './cote.js';

const MARGE_DANS_LA_CASE = 10;
const PAS_DE_LA_GRILLE = EMPREINTE_MAXIMALE + MARGE_DANS_LA_CASE;
// Portee par defaut : celle de la carte de Rouen. Une experience sur une autre
// ville fournit la sienne, pour que les batiments couvrent toute la vue.
const LIMITE_PAR_DEFAUT = 3400;
const PAS_DE_L_OCCUPATION = 12;
const RAYON_DES_VOIES_PRINCIPALES = 15;
const RAYON_DES_VOIES_SECONDAIRES = 9;
const MARGE_AUTOUR_DU_FLEUVE = 20;
// Bande interdite au large du trait de cote : sans elle, des maisons se
// construiraient sur la mer, du cote ou aucune donnee ne dit qu'il y a de l'eau.
const DISTANCES_AU_LARGE = [80, 240, 420, 620, 820];
const RAYON_AU_LARGE = 140;
const RAYON_AUTOUR_DES_LIEUX = 55;
const PROPORTION_DE_CASES_VIDES = 0.06;
const ESSAIS_DE_PLACEMENT = 4;
const GRAINE = 20260825;

// Tout ce qui vient du fond de carte reel devient interdit a la construction.
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
  for (const plan of fond.plansDEau) grille.marquerUnPolygone(plan);
  for (const trace of fond.littoral) {
    grille.marquerUneLigne(trace, RAYON_AU_LARGE);
    for (const distance of DISTANCES_AU_LARGE) {
      grille.marquerUneLigne(decalerVersLEau(trace, distance), RAYON_AU_LARGE);
    }
  }
  // Un segment de longueur nulle marque simplement un disque autour du point.
  for (const lieu of positionsDesLieux) {
    grille.marquerUneLigne([[lieu.x, lieu.y], [lieu.x, lieu.y]], RAYON_AUTOUR_DES_LIEUX);
  }
  return grille;
};

export const construireDecor = (fond, positionsDesLieux = [], limiteDeLaVille = LIMITE_PAR_DEFAUT) => {
  const grille = preparerLaGrille(fond, positionsDesLieux, limiteDeLaVille);
  const aleatoire = creerAleatoire(GRAINE);
  const choisirUnBatiment = creerSelecteurDeBatiments(aleatoire);
  const lesBatiments = [];

  for (let x = -limiteDeLaVille; x <= limiteDeLaVille; x += PAS_DE_LA_GRILLE) {
    for (let y = -limiteDeLaVille; y <= limiteDeLaVille; y += PAS_DE_LA_GRILLE) {
      if (aleatoire() < PROPORTION_DE_CASES_VIDES) continue;
      const batiment = choisirUnBatiment();
      const placeLibreEnX = Math.max(0, PAS_DE_LA_GRILLE - MARGE_DANS_LA_CASE - batiment.largeur);
      const placeLibreEnY = Math.max(0, PAS_DE_LA_GRILLE - MARGE_DANS_LA_CASE - batiment.profondeur);
      // Plusieurs essais dans la case : les ilots reels sont de tailles tres variables.
      for (let essai = 0; essai < ESSAIS_DE_PLACEMENT; essai += 1) {
        const position = { x: x + aleatoire() * placeLibreEnX, y: y + aleatoire() * placeLibreEnY };
        if (!grille.emplacementLibre(position.x, position.y, batiment.largeur, batiment.profondeur)) {
          continue;
        }
        lesBatiments.push({ ...batiment, ...position });
        break;
      }
    }
  }
  // Les batiments les plus lointains sont dessines en premier.
  lesBatiments.sort((premier, second) => second.y - premier.y);
  return { lesBatiments };
};
