// Vérifications de la vue : aucun bord de carte ne doit être visible, et
// changer de ville doit tout remettre à zéro — un dessin posé sur Rouen ne veut
// plus rien dire sur Lyon.
import { verifier, titre } from './outils-de-test.js';
import { creerProjection, definirLOrientationDuMonde } from '../public/scripts/carte/projection.js';
import { cadreDeLaZone, restreindreAuxDonnees } from '../public/scripts/commun/cadre-de-ville.js';
import { etat, definirLaVille, ajouterUnLieu, reinitialiserLesPlacements } from '../public/scripts/creation/etat.js';

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

// Part du coin d'écran le plus éloigné du centre, en mètres.
const eloignementMaximal = (projection, largeur, hauteur) => {
  const coins = [[0, 0], [largeur, 0], [0, hauteur], [largeur, hauteur]];
  let maximum = 0;
  for (const [x, y] of coins) {
    const point = projection.versMetriqueDepuisEcran(x, y);
    maximum = Math.max(maximum, Math.abs(point.x), Math.abs(point.y));
  }
  return maximum;
};

export const verifierLaVueSansBords = () => {
  definirLOrientationDuMonde(false);
  titre('Vue : le canvas ne montre jamais au-delà des données');

  // Une ville largement plus grande que ce que le serveur a pu cartographier :
  // c'est le cas qui laissait apparaître les rebords.
  const cadre = cadreDeLaZone(zone(9000, 9000));
  const portee = 5040;

  for (const [nom, largeur, hauteur] of ECRANS) {
    let projection = creerProjection(largeur, hauteur, cadre);
    const avant = eloignementMaximal(projection, largeur, hauteur);
    const cadreVu = restreindreAuxDonnees(cadre, portee, projection, largeur, hauteur);
    projection = creerProjection(largeur, hauteur, cadreVu);
    const apres = eloignementMaximal(projection, largeur, hauteur);

    verifier(avant > portee, `${nom} : sans garde-fou, la vue débordait (${Math.round(avant)} m > ${portee} m)`);
    verifier(apres <= portee, `${nom} : la vue reste dans les données (${Math.round(apres)} m)`);
    verifier(cadreVu.centre === cadre.centre, `${nom} : le centre de la ville ne bouge pas`);
  }
};

export const verifierLaVueSuffisante = () => {
  titre('Vue : une ville entièrement cartographiée n’est jamais rognée');
  const cadre = cadreDeLaZone(zone(3000, 3000));
  const projection = creerProjection(1536, 1080, cadre);
  const inchange = restreindreAuxDonnees(cadre, 20000, projection, 1536, 1080);
  verifier(inchange === cadre, 'des données largement suffisantes laissent le cadrage tel quel');
  verifier(restreindreAuxDonnees(cadre, 0, projection, 1536, 1080) === cadre, 'sans portée connue, on ne rogne rien');
};

export const verifierLaRemiseAZero = () => {
  titre('Changement de ville : les placements repartent de zéro');
  definirLaVille({ cle: 'rouen', nom: 'Rouen' });
  ajouterUnLieu({ nom: 'Le jardin', point: { x: 120, y: -40 } });
  ajouterUnLieu({ nom: 'Le café', point: { x: -300, y: 80 } });
  verifier(etat.lieux.every((lieu) => lieu.point), 'les deux lieux sont bien posés sur la carte');

  const nomsAvant = etat.lieux.map((lieu) => lieu.nom).join(' / ');
  reinitialiserLesPlacements();
  verifier(etat.lieux.every((lieu) => lieu.point === null), 'après la remise à zéro, plus aucun point n’est placé');
  verifier(etat.lieux.length === 2, 'les lieux eux-mêmes sont conservés : seul leur emplacement est perdu');
  verifier(etat.lieux.map((lieu) => lieu.nom).join(' / ') === nomsAvant, 'leurs noms restent intacts');
};
