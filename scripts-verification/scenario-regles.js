// Vérifications qui n'ont pas besoin du serveur HTTP : unicité des adresses,
// mesure du cadrage d'une ville et traduction des catégories de lieux.
import { verifier, titre } from './outils-de-test.js';
import { entrepot } from '../serveur/services/entrepot.js';
import { creerUneExperience, PREFIXE_DES_EXPERIENCES } from '../serveur/services/experiences.js';
import { SLUG_VALIDE, extraireLeSlug, composerLeLien } from '../serveur/services/slug.js';
import { mesurerLaVille, RAYON_MAXIMAL_EN_METRES } from '../serveur/utilitaires/etendue-de-ville.js';
import { mesurerLaZoneBatie } from '../serveur/services/zone-batie.js';
import { categoriesVisees } from '../serveur/services/requete-de-lieux.js';
import { marquerLaZone } from '../public/scripts/commun/remplissage.js';
import { VILLE_DE_TEST } from './donnees-de-test.js';

const CREATIONS_SIMULTANEES = 30;

export const verifierLUniciteDesAdresses = async () => {
  titre('Unicité des adresses');

  // Le stockage lui-même refuse d'écrire sur une clé déjà prise.
  const cle = `${PREFIXE_DES_EXPERIENCES}test-unicite-cle`;
  const premiere = await entrepot.creerDocumentSiAbsent(cle, { essai: 1 });
  const seconde = await entrepot.creerDocumentSiAbsent(cle, { essai: 2 });
  verifier(premiere === true, 'une adresse libre est bien réservée');
  verifier(seconde === false, 'une adresse déjà prise est refusée par le stockage');
  const relu = await entrepot.lireDocument(cle);
  verifier(relu?.essai === 1, 'une expérience existante n’est jamais écrasée');

  // Trente créations lancées en même temps : aucune ne doit en écraser une autre.
  const creations = await Promise.all(
    Array.from({ length: CREATIONS_SIMULTANEES }, () =>
      creerUneExperience({ lieux: [], disponibilites: [] }, VILLE_DE_TEST, 'mot-de-passe-solide'),
    ),
  );
  const adresses = creations.map((experience) => experience.slug);
  verifier(
    new Set(adresses).size === CREATIONS_SIMULTANEES,
    `${CREATIONS_SIMULTANEES} créations simultanées donnent ${CREATIONS_SIMULTANEES} adresses distinctes`,
  );
  verifier(adresses.every((slug) => SLUG_VALIDE.test(slug)), 'toutes les adresses sont bien formées');
  verifier(
    adresses.every((slug) => extraireLeSlug(`${slug}-for-you`) === slug),
    'chaque lien -for-you renvoie bien vers son adresse',
  );
  verifier(
    new Set(adresses.map(composerLeLien)).size === CREATIONS_SIMULTANEES,
    'les liens partagés sont uniques eux aussi',
  );
};

export const verifierLeCadrageDesVilles = () => {
  titre('Cadrage adapté à chaque ville');
  const boite = (sud, nord, ouest, est) => ({ sud, nord, ouest, est });

  const petite = mesurerLaVille(boite(49.44, 49.46, 1.09, 1.11), 49.45);
  const moyenne = mesurerLaVille(boite(49.4172, 49.4652, 1.0301, 1.1521), 49.44);
  const grande = mesurerLaVille(boite(48.8156, 48.9022, 2.2241, 2.4698), 48.86);

  verifier(petite.rayon < moyenne.rayon, 'une petite ville reçoit un cadre plus serré qu’une moyenne');
  verifier(moyenne.rayon <= grande.rayon, 'une grande ville reçoit un cadre au moins aussi large');
  verifier(
    new Set([petite.rayon, moyenne.rayon, grande.rayon]).size > 1,
    'le zoom n’est pas identique pour toutes les villes',
  );
  verifier(grande.rayon <= RAYON_MAXIMAL_EN_METRES, 'le cadre reste borné, même pour une métropole');
  verifier(mesurerLaVille(null, 49).rayon > 0, 'une ville sans boîte englobante reste cadrable');

  // Deux rues au centre et une route qui file au loin : le cadre suit le centre.
  const centre = Array.from({ length: 400 }, (rien, rang) => [[rang % 200, rang % 150]]);
  const echappee = [[[0, 0], [9000, 9000]]];
  const zone = mesurerLaZoneBatie([...centre, ...echappee], null);
  verifier(
    zone.maximumX < 3000 && zone.maximumY < 3000,
    'une route de campagne n’étire pas le cadrage de la ville',
  );
};

export const verifierLesCategoriesDeLieux = () => {
  titre('Recherche des lieux d’intérêt');
  const vise = (terme, famille, valeur) =>
    categoriesVisees(terme).some(([f, v]) => f === famille && v === valeur);

  verifier(vise('cathedrale', 'building', 'cathedral'), 'une cathédrale est cherchée comme telle');
  verifier(vise('cathédrale', 'amenity', 'place_of_worship'), 'les accents ne changent rien');
  verifier(vise('musee', 'tourism', 'museum'), 'un musée est cherché comme tel');
  verifier(vise('monument', 'historic', 'monument'), 'un monument est cherché comme tel');
  verifier(vise('parc', 'leisure', 'park'), 'un parc est cherché comme tel');
  verifier(vise('point de vue', 'tourism', 'viewpoint'), 'un point de vue est cherché comme tel');
  verifier(vise('bar', 'amenity', 'bar'), 'les établissements restent trouvables');
  verifier(categoriesVisees('pizzeria').length > 0, 'un terme inconnu reste cherché tel quel');
};

// Image de test : un carré noir tracé sur fond blanc, comme un îlot de la carte.
const imageAvecUnCarre = (cote, debut, fin) => {
  const pixels = new Uint8ClampedArray(cote * cote * 4).fill(255);
  const noircir = (x, y) => {
    const position = (y * cote + x) * 4;
    pixels[position] = 0;
    pixels[position + 1] = 0;
    pixels[position + 2] = 0;
  };
  for (let rang = debut; rang <= fin; rang += 1) {
    noircir(rang, debut);
    noircir(rang, fin);
    noircir(debut, rang);
    noircir(fin, rang);
  }
  return pixels;
};

export const verifierLeRemplissageDeZone = () => {
  titre('Remplissage d’une zone');
  const cote = 40;
  const pixels = imageAvecUnCarre(cote, 10, 30);

  const interieur = marquerLaZone(pixels, cote, cote, 20, 20);
  const comptees = interieur.reduce((somme, valeur) => somme + valeur, 0);
  verifier(comptees === 19 * 19, 'le remplissage couvre exactement l’intérieur du contour');
  verifier(interieur[5 * cote + 5] === 0, 'il ne déborde pas hors du contour');
  verifier(interieur[10 * cote + 20] === 0, 'il ne recouvre pas le trait de la carte');

  // Sans contour fermé, la zone dépasse le garde-fou : on renonce plutôt que
  // de recouvrir toute la carte.
  const sansContour = new Uint8ClampedArray(cote * cote * 4).fill(255);
  verifier(marquerLaZone(sansContour, cote, cote, 20, 20) === null, 'une zone ouverte n’est pas remplie');
};
