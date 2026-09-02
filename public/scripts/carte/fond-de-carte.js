// Nettoyage du fond de carte d'une ville, tel que le serveur l'a produit :
// les coordonnees sont deja en metres, dans le repere du projet.
// On ne fait pas confiance au fichier : chaque partie est verifiee avant usage.
const listeDeLignes = (valeur) => (Array.isArray(valeur) ? valeur : []);

// Jusqu'ou vont les donnees, en metres autour du centre. Les fonds produits
// avant que le serveur ne l'indique la donnent eux-memes, par leurs traces.
const porteeDesDonnees = (fond, propre) => {
  if (Number.isFinite(fond?.portee) && fond.portee > 0) return fond.portee;
  let maximum = 0;
  const voir = (points) => {
    for (const [x, y] of points) maximum = Math.max(maximum, Math.abs(x), Math.abs(y));
  };
  propre.riviere.forEach((bras) => voir(bras.points));
  for (const famille of ['littoral', 'plansDEau', 'voiesPrincipales', 'voiesSecondaires', 'parcs']) {
    propre[famille].forEach(voir);
  }
  return Math.round(maximum);
};

const decrire = (fond) => ({
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

export const nettoyerLeFond = (fond) => {
  const propre = decrire(fond);
  return { ...propre, portee: porteeDesDonnees(fond, propre) };
};
