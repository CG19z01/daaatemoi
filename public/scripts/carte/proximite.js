// Distance à la voie la plus proche, calculée une fois pour toute la ville.
//
// Le décor ne se construit qu'à portée d'une rue : c'est ce qui garantit qu'on
// ne bâtit jamais en pleine mer. Marquer un disque autour de chaque point de
// chaque voie coûtait le carré du rayon — porter ce rayon à un kilomètre
// demandait près de deux secondes. On marque donc seulement les cases
// traversées par une voie, puis on propage la distance en deux balayages.
// Le coût ne dépend plus du rayon, mais seulement de la finesse de la grille.
const PAS = 100;
// Approximation de chanfrein : un pas droit vaut 1, un pas en diagonale √2.
const DIAGONALE = Math.SQRT2;

export const creerDistanceAuxVoies = (voies, limite) => {
  const cotes = Math.ceil((limite * 2) / PAS) + 1;
  const distances = new Float32Array(cotes * cotes).fill(Infinity);
  const caseDe = (valeur) => Math.floor((valeur + limite) / PAS);

  const marquer = (x, y) => {
    const colonne = caseDe(x);
    const ligne = caseDe(y);
    if (colonne < 0 || ligne < 0 || colonne >= cotes || ligne >= cotes) return;
    distances[ligne * cotes + colonne] = 0;
  };

  // Chaque voie est parcourue pas à pas : aucune case traversée n'est manquée.
  for (const voie of voies) {
    for (let rang = 1; rang < voie.length; rang += 1) {
      const [departX, departY] = voie[rang - 1];
      const [arriveeX, arriveeY] = voie[rang];
      const etapes = Math.max(1, Math.ceil(Math.hypot(arriveeX - departX, arriveeY - departY) / (PAS / 2)));
      for (let etape = 0; etape <= etapes; etape += 1) {
        const avancement = etape / etapes;
        marquer(departX + (arriveeX - departX) * avancement, departY + (arriveeY - departY) * avancement);
      }
    }
  }

  const propager = (ligne, colonne, voisins) => {
    let meilleure = distances[ligne * cotes + colonne];
    for (const [decalageLigne, decalageColonne, cout] of voisins) {
      const autreLigne = ligne + decalageLigne;
      const autreColonne = colonne + decalageColonne;
      if (autreLigne < 0 || autreColonne < 0 || autreLigne >= cotes || autreColonne >= cotes) continue;
      meilleure = Math.min(meilleure, distances[autreLigne * cotes + autreColonne] + cout * PAS);
    }
    distances[ligne * cotes + colonne] = meilleure;
  };

  const AVANT = [[-1, 0, 1], [0, -1, 1], [-1, -1, DIAGONALE], [-1, 1, DIAGONALE]];
  const ARRIERE = [[1, 0, 1], [0, 1, 1], [1, 1, DIAGONALE], [1, -1, DIAGONALE]];
  for (let ligne = 0; ligne < cotes; ligne += 1) {
    for (let colonne = 0; colonne < cotes; colonne += 1) propager(ligne, colonne, AVANT);
  }
  for (let ligne = cotes - 1; ligne >= 0; ligne -= 1) {
    for (let colonne = cotes - 1; colonne >= 0; colonne -= 1) propager(ligne, colonne, ARRIERE);
  }

  return (x, y) => {
    const colonne = caseDe(x);
    const ligne = caseDe(y);
    if (colonne < 0 || ligne < 0 || colonne >= cotes || ligne >= cotes) return Infinity;
    return distances[ligne * cotes + colonne];
  };
};
