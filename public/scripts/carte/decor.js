// Generation des batiments dans les espaces reellement libres du fond de carte :
// jamais sur le fleuve, jamais sur une voie, jamais dans un parc.
import { creerAleatoire } from './hasard.js';
import { creerSelecteurDeBatiments } from './selection-batiments.js';
import { EMPREINTE_MAXIMALE } from './modeles-batiments.js';
import { creerGrilleDOccupation } from './occupation.js';

const MARGE_DANS_LA_CASE = 10;
const PAS_DE_LA_GRILLE = EMPREINTE_MAXIMALE + MARGE_DANS_LA_CASE;
const LIMITE_DE_LA_VILLE = 3400;
const PAS_DE_L_OCCUPATION = 12;
const RAYON_DES_VOIES_PRINCIPALES = 15;
const RAYON_DES_VOIES_SECONDAIRES = 9;
const MARGE_AUTOUR_DU_FLEUVE = 20;
const RAYON_AUTOUR_DES_LIEUX = 55;
const PROPORTION_DE_CASES_VIDES = 0.06;
const ESSAIS_DE_PLACEMENT = 4;
const GRAINE = 20260825;

// Tout ce qui vient du fond de carte reel devient interdit a la construction.
const preparerLaGrille = (fond, positionsDesLieux) => {
  const grille = creerGrilleDOccupation(LIMITE_DE_LA_VILLE + PAS_DE_LA_GRILLE, PAS_DE_L_OCCUPATION);
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
  // Un segment de longueur nulle marque simplement un disque autour du point.
  for (const lieu of positionsDesLieux) {
    grille.marquerUneLigne([[lieu.x, lieu.y], [lieu.x, lieu.y]], RAYON_AUTOUR_DES_LIEUX);
  }
  return grille;
};

export const construireDecor = (fond, positionsDesLieux = []) => {
  const grille = preparerLaGrille(fond, positionsDesLieux);
  const aleatoire = creerAleatoire(GRAINE);
  const choisirUnBatiment = creerSelecteurDeBatiments(aleatoire);
  const lesBatiments = [];

  for (let x = -LIMITE_DE_LA_VILLE; x <= LIMITE_DE_LA_VILLE; x += PAS_DE_LA_GRILLE) {
    for (let y = -LIMITE_DE_LA_VILLE; y <= LIMITE_DE_LA_VILLE; y += PAS_DE_LA_GRILLE) {
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
