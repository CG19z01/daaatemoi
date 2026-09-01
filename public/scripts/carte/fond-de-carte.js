// Fond de carte reel de Rouen, extrait d'OpenStreetMap.
// Les coordonnees du fichier sont deja en metres, dans le repere du projet.
const ADRESSE_DU_FOND = '/donnees/carte-rouen.json';

const FOND_VIDE = {
  riviere: [],
  littoral: [],
  plansDEau: [],
  voiesPrincipales: [],
  voiesSecondaires: [],
  parcs: [],
};

const listeDeLignes = (valeur) => (Array.isArray(valeur) ? valeur : []);

// On ne fait pas confiance au fichier : chaque partie est verifiee avant usage.
export const nettoyerLeFond = (fond) => ({
  riviere: listeDeLignes(fond?.riviere)
    .filter((bras) => Array.isArray(bras?.points) && bras.points.length >= 2)
    .map((bras) => ({ largeur: Number(bras.largeur) || 120, points: bras.points })),
  // Trait de cote et plans d'eau : absents des fonds anterieurs, donc vides.
  littoral: listeDeLignes(fond?.littoral).filter((trace) => trace.length >= 2),
  plansDEau: listeDeLignes(fond?.plansDEau).filter((plan) => plan.length >= 3),
  voiesPrincipales: listeDeLignes(fond?.voiesPrincipales).filter((voie) => voie.length >= 2),
  voiesSecondaires: listeDeLignes(fond?.voiesSecondaires).filter((voie) => voie.length >= 2),
  parcs: listeDeLignes(fond?.parcs).filter((parc) => parc.length >= 3),
});

const pivoterUneLigne = (points) => points.map(([x, y]) => [y, -x]);

// Meme quart de tour que le monde, applique au fond de carte.
export const orienterLeFond = (fond, pivote) => {
  if (!pivote) return fond;
  return {
    riviere: fond.riviere.map((bras) => ({ ...bras, points: pivoterUneLigne(bras.points) })),
    littoral: fond.littoral.map(pivoterUneLigne),
    plansDEau: fond.plansDEau.map(pivoterUneLigne),
    voiesPrincipales: fond.voiesPrincipales.map(pivoterUneLigne),
    voiesSecondaires: fond.voiesSecondaires.map(pivoterUneLigne),
    parcs: fond.parcs.map(pivoterUneLigne),
  };
};

export const chargerLeFondDeCarte = async () => {
  try {
    const reponse = await fetch(ADRESSE_DU_FOND, { credentials: 'same-origin' });
    if (!reponse.ok) return FOND_VIDE;
    return nettoyerLeFond(await reponse.json());
  } catch {
    // Sans fond de carte, la ville se dessine quand meme.
    return FOND_VIDE;
  }
};
