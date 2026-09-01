// Recherche d'etablissements reels dans la ville choisie, via Overpass
// (OpenStreetMap). Gratuit, sans compte ni cle API : il n'y a donc aucun secret
// a proteger, et rien de sensible ne transite par le navigateur.
// Les horaires viennent de l'etiquette opening_hours quand elle existe.
import { interrogerOverpass } from './overpass.js';
import {
  composerLaRequeteDeLieux,
  FAMILLES,
  motifDuNom,
  categoriesVisees,
} from './requete-de-lieux.js';
import { RAYON_MINIMAL_EN_METRES } from '../utilitaires/etendue-de-ville.js';
import { analyserLesHorairesOsm } from '../utilitaires/horaires-osm.js';

export const LONGUEUR_MINIMALE_DE_LA_RECHERCHE = 2;
const LONGUEUR_MAXIMALE_DE_LA_RECHERCHE = 40;
const NOMBRE_MAXIMAL_DE_RESULTATS = 12;

// Le terme est ramene aux lettres, chiffres, espaces, apostrophes et tirets :
// aucune syntaxe Overpass ni aucun guillemet ne peut s'y glisser.
export const nettoyerLeTermeRecherche = (terme) =>
  String(terme ?? '')
    .replace(/[^\p{L}\p{N} '-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGUEUR_MAXIMALE_DE_LA_RECHERCHE);

// "12 rue des Carmes, Rouen", en ne gardant que ce qui est reellement connu.
const composerLAdresse = (etiquettes) => {
  const rue = [etiquettes['addr:housenumber'], etiquettes['addr:street']]
    .filter(Boolean)
    .join(' ');
  return [rue, etiquettes['addr:city']].filter(Boolean).join(', ').slice(0, 120);
};

const laCategorie = (etiquettes) => {
  for (const famille of FAMILLES) {
    if (etiquettes[famille]) return String(etiquettes[famille]).replace(/_/g, ' ').slice(0, 40);
  }
  return '';
};

// Vrai si l'element porte bien l'une des etiquettes visees par la recherche.
const correspondALaCategorie = (etiquettes, categories) =>
  categories.some(([famille, valeur]) => etiquettes[famille] === valeur);

const convertirUnResultat = (element, categories) => {
  const etiquettes = element.tags ?? {};
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!etiquettes.name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const horaires = analyserLesHorairesOsm(etiquettes.opening_hours);
  return {
    reference: `osm-${element.type}-${element.id}`,
    nom: String(etiquettes.name).slice(0, 80),
    adresse: composerLAdresse(etiquettes),
    categorie: laCategorie(etiquettes),
    latitude,
    longitude,
    horaires,
    horairesTrouves: horaires !== null,
    estDuTypeCherche: correspondALaCategorie(etiquettes, categories),
  };
};

// Classement, du plus pertinent au moins pertinent :
//   - le lieu est vraiment du type cherche (une cathedrale quand on cherche
//     « cathedrale »), et non un commerce qui en porte le nom ;
//   - son nom contient le terme ;
//   - ses horaires sont connus.
// Sans ce premier critere, « Hotel de la Cathedrale » passerait devant la
// cathedrale elle-meme, qui n'affiche pas d'horaires.
const rang = (lieu, expressionDuNom) =>
  Number(lieu.estDuTypeCherche) * 4 +
  Number(expressionDuNom.test(lieu.nom)) * 2 +
  Number(lieu.horairesTrouves);

export const rechercherDesLieux = async (terme, ville) => {
  const rayon = Number(ville.rayon) > 0 ? Number(ville.rayon) : RAYON_MINIMAL_EN_METRES;
  const elements = await interrogerOverpass(composerLaRequeteDeLieux(terme, ville, rayon));
  const expressionDuNom = new RegExp(motifDuNom(terme), 'i');
  const categories = categoriesVisees(terme);
  const vus = new Set();
  return elements
    .map((element) => convertirUnResultat(element, categories))
    .filter(Boolean)
    .filter((lieu) => !vus.has(lieu.reference) && vus.add(lieu.reference))
    .sort((premier, second) => rang(second, expressionDuNom) - rang(premier, expressionDuNom))
    .slice(0, NOMBRE_MAXIMAL_DE_RESULTATS);
};
