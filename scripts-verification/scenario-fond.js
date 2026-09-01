// Vérifications du fond de carte : répartition des éléments OpenStreetMap et
// allègement des villes trop denses.
import { verifier, titre } from './outils-de-test.js';
import { classer, eclaircir, MAXIMUM } from '../serveur/services/tri-du-fond.js';
import { decalerVersLEau } from '../public/scripts/carte/cote.js';
import { construireDecor } from '../public/scripts/carte/decor.js';
import { estDansLePolygone } from '../public/scripts/carte/occupation.js';

export const verifierLeTriDuFond = () => {
  titre('Composition du fond de carte');

  verifier(classer({ natural: 'coastline' }) === 'littoral', 'un trait de côte est reconnu');
  verifier(classer({ natural: 'water' }) === 'plansDEau', 'un plan d’eau est reconnu');
  verifier(classer({ waterway: 'river' }) === 'riviere', 'un fleuve reste un fleuve');
  verifier(classer({ highway: 'primary' }) === 'voiesPrincipales', 'une voie principale est reconnue');
  verifier(classer({ highway: 'residential' }) === 'voiesSecondaires', 'une rue est reconnue');
  verifier(classer({ leisure: 'park' }) === 'parcs', 'un parc est reconnu');
  verifier(classer({ building: 'yes' }) === null, 'le reste est ignoré');

  titre('Allègement d’une ville dense');
  // Mille rues numérotées d'ouest en est : après allègement, il doit rester des
  // rues des deux côtés de la ville, pas seulement du côté arrivé en premier.
  const rues = Array.from({ length: 1000 }, (rien, rang) => rang);
  const allegees = eclaircir(rues, 100);
  verifier(allegees.length === 100, 'le nombre de tracés est ramené à la limite');
  verifier(allegees[0] < 50, 'le début de la ville est conservé');
  verifier(allegees.at(-1) > 950, 'la fin de la ville est conservée aussi');
  const ecarts = allegees.slice(1).map((valeur, rang) => valeur - allegees[rang]);
  verifier(
    Math.max(...ecarts) - Math.min(...ecarts) <= 1,
    'les tracés retenus sont répartis régulièrement, sans quartier oublié',
  );
  verifier(eclaircir([1, 2, 3], 100).length === 3, 'une petite ville n’est pas touchée');
  verifier(MAXIMUM.voiesSecondaires > 5000, 'la limite des rues laisse de la marge');
};

export const verifierLeCoteDeLEau = () => {
  titre('Côté eau d’un trait de côte');
  // Un trait de côte qui va vers le nord : par convention OpenStreetMap, la
  // terre est à gauche (ouest) et l'eau à droite (est).
  const versLeNord = [[0, 0], [0, 100], [0, 200]];
  const versLEau = decalerVersLEau(versLeNord, 50);
  verifier(versLEau[1][0] > 0, 'l’écume est bien tracée du côté de l’eau');
  verifier(Math.round(versLEau[1][1]) === 100, 'le décalage reste perpendiculaire au trait');
  verifier(
    decalerVersLEau(versLeNord, 50).length === versLeNord.length,
    'le tracé décalé garde le même nombre de points',
  );
};

const carre = (x, y, cote) => [
  [x, y],
  [x + cote, y],
  [x + cote, y + cote],
  [x, y + cote],
  [x, y],
];

export const verifierLeDecor = () => {
  titre('Ville bâtie, eau laissée vide');
  // Trait de côte orienté vers le nord : par convention, la mer est à l'est.
  const mare = carre(-900, -900, 260);
  const fond = {
    riviere: [],
    littoral: [[[0, -2000], [0, 0], [0, 2000]]],
    plansDEau: [mare],
    voiesPrincipales: [],
    voiesSecondaires: [],
    parcs: [],
  };

  const { lesBatiments } = construireDecor(fond, [], 1500);
  verifier(lesBatiments.length > 300, `la terre se couvre de bâtiments (${lesBatiments.length})`);
  verifier(
    lesBatiments.every((batiment) => batiment.x < 0),
    'aucun bâtiment n’est construit au large',
  );
  verifier(
    lesBatiments.every((batiment) => !estDansLePolygone(batiment.x, batiment.y, mare)),
    'aucun bâtiment n’est construit dans un plan d’eau, même petit',
  );

  // Sans eau ni voie, il ne doit rester aucun vide voulu dans la ville.
  const pleine = construireDecor(
    { riviere: [], littoral: [], plansDEau: [], voiesPrincipales: [], voiesSecondaires: [], parcs: [] },
    [],
    700,
  );
  const cases = Math.ceil((700 * 2) / 70) ** 2;
  verifier(
    pleine.lesBatiments.length >= cases * 0.95,
    `une terre libre est bâtie presque case par case (${pleine.lesBatiments.length}/${cases})`,
  );
};

export const verifierUnLittoralMorcele = () => {
  titre('Littoral rendu en plusieurs tronçons');
  // Overpass découpe souvent une même côte en une dizaine de morceaux, dont de
  // très courts près d'un port. Fermer chaque morceau en polygone donnait des
  // contours qui se recouvraient et s'annulaient : toute la ville de Dieppe
  // passait alors pour de l'eau, et 28 maisons seulement subsistaient, au large.
  const morceaux = [
    [[0, -2000], [0, -1200]],
    [[0, -1200], [0, -1190]],
    [[0, -1190], [0, -400]],
    [[0, -400], [0, -395]],
    [[0, -395], [0, 600]],
    [[0, 600], [0, 2000]],
  ];
  const fond = {
    riviere: [],
    littoral: morceaux,
    plansDEau: [],
    voiesPrincipales: [],
    voiesSecondaires: [],
    parcs: [],
  };

  const { lesBatiments } = construireDecor(fond, [], 1500);
  verifier(
    lesBatiments.length > 300,
    `la terre reste bâtie malgré un littoral morcelé (${lesBatiments.length} bâtiments)`,
  );
  verifier(
    lesBatiments.every((batiment) => batiment.x < 0),
    'aucun bâtiment n’est posé au large, même avec des tronçons très courts',
  );
};
