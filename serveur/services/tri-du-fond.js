// Répartition des éléments OpenStreetMap dans les familles du fond de carte,
// et réduction du nombre de tracés quand une ville en fournit trop.
//
// Tronquer les premiers arrivés laisserait des quartiers entiers sans une seule
// rue : c'est ce qui creusait des trous dans les grandes villes. On garde donc
// un tracé sur N, réparti sur toute la ville, plutôt que les N premiers.
const EST_PRINCIPALE = /^(motorway|trunk|primary|secondary)(_link)?$/;
const EST_SECONDAIRE = /^(tertiary|residential|unclassified|pedestrian|living_street)$/;

export const classer = (etiquettes = {}) => {
  if (etiquettes.waterway === 'river' || etiquettes.waterway === 'canal') return 'riviere';
  if (etiquettes.natural === 'coastline') return 'littoral';
  if (etiquettes.natural === 'water') return 'plansDEau';
  if (etiquettes.leisure === 'park' || etiquettes.leisure === 'garden') return 'parcs';
  if (EST_PRINCIPALE.test(etiquettes.highway ?? '')) return 'voiesPrincipales';
  if (EST_SECONDAIRE.test(etiquettes.highway ?? '')) return 'voiesSecondaires';
  return null;
};

// Bornes de sécurité : un centre-ville très dense ne doit pas produire un fond
// trop lourd à stocker puis à redessiner sur un téléphone.
export const MAXIMUM = {
  riviere: 120,
  littoral: 400,
  plansDEau: 400,
  voiesPrincipales: 2600,
  voiesSecondaires: 6000,
  parcs: 400,
};

// Un tracé sur N, en conservant les extrémités de la liste : la ville reste
// couverte de bout en bout, seulement moins finement.
export const eclaircir = (traces, maximum) => {
  if (traces.length <= maximum) return traces;
  const pas = traces.length / maximum;
  const conserves = [];
  for (let rang = 0; conserves.length < maximum; rang += 1) {
    conserves.push(traces[Math.floor(rang * pas)]);
  }
  return conserves;
};

// Applique la réduction à chaque famille du fond.
export const eclaircirLeFond = (fond) => {
  const allege = {};
  for (const [famille, traces] of Object.entries(fond)) {
    allege[famille] = eclaircir(traces, MAXIMUM[famille] ?? traces.length);
  }
  return allege;
};
