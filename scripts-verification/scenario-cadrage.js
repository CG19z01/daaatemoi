// Vérifications du cadrage : la ville entière tient dans le canvas, le zoom
// s'adapte à sa taille comme au format de l'écran, et la projection reste
// réversible — le placement des points, des textes et des remplissages en dépend.
import { verifier, titre } from './outils-de-test.js';
import { creerProjection, definirLOrientationDuMonde } from '../public/scripts/carte/projection.js';
import { cadreDeLaZone } from '../public/scripts/commun/cadre-de-ville.js';
import { nettoyerLeFond } from '../public/scripts/carte/fond-de-carte.js';
import { creerDistanceAuxVoies } from '../public/scripts/carte/proximite.js';

const ECRANS = [
  ['ordinateur', 1536, 1080],
  ['tablette en hauteur', 640, 1366],
  ['mobile, panneau ouvert', 390, 321],
  ['mobile, panneau replié', 390, 844],
];

const zone = (largeur, profondeur) => ({
  minimumX: -largeur / 2,
  maximumX: largeur / 2,
  minimumY: -profondeur / 2,
  maximumY: profondeur / 2,
});

// Les quatre coins de la ville, une fois projetés à l'écran.
const coinsProjetes = (projection, cadre) => {
  const demiLargeur = cadre.etendue.largeur / 2;
  const demiProfondeur = cadre.etendue.profondeur / 2;
  return [
    [-demiLargeur, -demiProfondeur],
    [demiLargeur, -demiProfondeur],
    [demiLargeur, demiProfondeur],
    [-demiLargeur, demiProfondeur],
  ].map(([x, y]) => projection.versEcranMetrique(cadre.centre.x + x, cadre.centre.y + y, 0));
};

export const verifierLeCadrage = () => {
  definirLOrientationDuMonde(false);
  titre('Cadrage : la ville entière tient dans le canvas');

  const villes = [
    ['un village', zone(1400, 1400)],
    ['une ville moyenne', zone(6500, 6500)],
    ['une métropole', zone(12000, 11000)],
    ['une ville tout en longueur', zone(11000, 2200)],
  ];

  for (const [nom, limites] of villes) {
    const cadre = cadreDeLaZone(limites);
    for (const [ecran, largeur, hauteur] of ECRANS) {
      const projection = creerProjection(largeur, hauteur, cadre);
      const coins = coinsProjetes(projection, cadre);
      const tient =
        coins.every((coin) => coin.x >= -1 && coin.x <= largeur + 1) &&
        coins.every((coin) => coin.y >= -1 && coin.y <= hauteur + 1);
      verifier(tient, `${nom} tient entièrement sur ${ecran}`);
    }
  }
};

export const verifierLeZoomAdapte = () => {
  titre('Le zoom suit la taille de la ville et le format de l’écran');
  const echelle = (limites, largeur, hauteur) =>
    creerProjection(largeur, hauteur, cadreDeLaZone(limites)).echelle;

  const village = echelle(zone(1400, 1400), 1536, 1080);
  const moyenne = echelle(zone(6500, 6500), 1536, 1080);
  const metropole = echelle(zone(12000, 11000), 1536, 1080);
  verifier(village > moyenne && moyenne > metropole, 'plus la ville est grande, plus la vue s’éloigne');
  verifier(
    new Set([village, moyenne, metropole]).size === 3,
    'aucune ville ne partage le zoom d’une autre',
  );

  // Une marge sépare la ville des bords. Elle se mesure sur la ville elle-même,
  // pas sur le cadre : c'est justement le cadre qui porte la marge.
  const limites = zone(6500, 6500);
  const cadre = cadreDeLaZone(limites);
  const projection = creerProjection(1536, 1080, cadre);
  const coinsDeLaVille = [
    [limites.minimumX, limites.minimumY],
    [limites.maximumX, limites.minimumY],
    [limites.maximumX, limites.maximumY],
    [limites.minimumX, limites.maximumY],
  ].map(([x, y]) => projection.versEcranMetrique(x, y, 0));
  const marge = Math.min(...coinsDeLaVille.map((coin) => coin.x));
  verifier(marge > 4, `la ville ne touche pas le bord (${Math.round(marge)} px de marge)`);

  const large = creerProjection(1536, 1080, cadre).inclinaison;
  const haut = creerProjection(390, 844, cadre).inclinaison;
  verifier(haut > large, 'la vue se redresse sur un écran en hauteur, pour combler le vide');
};

export const verifierLaProjectionReversible = () => {
  titre('Projection réversible');
  const cadre = cadreDeLaZone(zone(7000, 7000));
  let ecartMaximal = 0;
  for (const [, largeur, hauteur] of ECRANS) {
    const projection = creerProjection(largeur, hauteur, cadre);
    for (let x = 0; x <= largeur; x += largeur / 8) {
      for (let y = 0; y <= hauteur; y += hauteur / 8) {
        const metres = projection.versMetriqueDepuisEcran(x, y);
        const retour = projection.versEcranMetrique(metres.x, metres.y, 0);
        ecartMaximal = Math.max(ecartMaximal, Math.hypot(retour.x - x, retour.y - y));
      }
    }
  }
  verifier(ecartMaximal < 0.001, `un point retrouve sa place au pixel près (${ecartMaximal.toExponential(1)})`);
};

export const verifierLaPorteeDesDonnees = () => {
  titre('Portée des données, pour border la carte');
  const fond = nettoyerLeFond({ voiesPrincipales: [[[-800, -600], [900, 700]]] });
  verifier(fond.portee === 900, 'sans portée annoncée, elle se déduit des tracés');
  verifier(nettoyerLeFond({ portee: 5040 }).portee === 5040, 'sinon celle du serveur est reprise');
  verifier(nettoyerLeFond({}).portee === 0, 'un fond vide n’en annonce aucune, et tout l’écran devient bordure');
};

export const verifierLaDistanceAuxVoies = () => {
  titre('Distance à la voie la plus proche');
  // Une seule rue, du sud au nord, au milieu de rien.
  const debut = Date.now();
  const distance = creerDistanceAuxVoies([[[0, -2000], [0, 2000]]], 5200);
  const duree = Date.now() - debut;

  verifier(distance(0, 0) < 100, 'sur la rue, la distance est nulle');
  verifier(Math.abs(distance(600, 0) - 600) < 150, `à 600 m, elle vaut ${Math.round(distance(600, 0))} m`);
  verifier(Math.abs(distance(-1500, 500) - 1500) < 250, 'elle reste juste des deux côtés');
  verifier(distance(4800, 0) > 4000, 'loin de tout, elle est grande');
  verifier(distance(99000, 0) === Infinity, 'hors de la grille, elle est infinie');

  // Le coût ne dépend plus du rayon recherché : c'est tout l'intérêt du procédé.
  verifier(duree < 400, `le calcul reste rapide (${duree} ms pour toute la ville)`);
};
