// Vérifications du décor : la ville se bâtit partout où passent des rues, et
// nulle part sur l'eau.
import { verifier, titre } from './outils-de-test.js';
import { construireDecor } from '../public/scripts/carte/decor.js';
import { estDansLePolygone } from '../public/scripts/carte/occupation.js';

// Un quadrillage de rues, comme dans n'importe quelle ville : c'est lui qui
// autorise la construction, et c'est aussi la sécurité qui interdit la mer.
const quadrillage = (limite, pas) => {
  const voies = [];
  for (let valeur = -limite; valeur <= limite; valeur += pas) {
    voies.push([[-limite, valeur], [limite, valeur]]);
    voies.push([[valeur, -limite], [valeur, limite]]);
  }
  return voies;
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
    voiesSecondaires: quadrillage(2000, 400),
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

  // Une terre quadrillée de rues, sans eau : il ne doit rester aucun vide voulu.
  const pleine = construireDecor(
    {
      riviere: [],
      littoral: [],
      plansDEau: [],
      voiesPrincipales: [],
      voiesSecondaires: quadrillage(700, 400),
      parcs: [],
    },
    [],
    700,
  );
  const cases = Math.ceil((700 * 2) / 70) ** 2;
  verifier(
    pleine.lesBatiments.length >= cases * 0.8,
    `une terre desservie par des rues est bâtie case par case (${pleine.lesBatiments.length}/${cases})`,
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
    // Des rues des deux côtés du rivage : seule la mer doit rester vide.
    voiesSecondaires: quadrillage(1500, 400),
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

export const verifierLaSecuriteDesVoies = () => {
  titre('Sécurité : on ne bâtit qu’à portée d’une rue');
  // Une seule rue au milieu d'une vaste étendue. Quoi qu'OpenStreetMap raconte
  // du littoral, rien ne peut se construire là où aucune voie ne passe — et il
  // n'y a jamais de voie en pleine mer.
  const fond = {
    riviere: [],
    littoral: [],
    plansDEau: [],
    voiesPrincipales: [],
    voiesSecondaires: [[[-1000, -1200], [-1000, 1200]]],
    parcs: [],
  };

  const { lesBatiments } = construireDecor(fond, [], 3000);
  verifier(lesBatiments.length > 20, `les abords de la rue sont bâtis (${lesBatiments.length})`);
  verifier(
    lesBatiments.every((batiment) => Math.abs(batiment.x + 1000) < 400),
    'aucun bâtiment ne s’éloigne de la seule rue existante',
  );
  verifier(
    lesBatiments.every((batiment) => batiment.y > -1600 && batiment.y < 1600),
    'la construction s’arrête aussi au bout de la rue',
  );
};
