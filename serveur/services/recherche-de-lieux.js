// Recherche d'etablissements reels dans la ville choisie, via Overpass
// (OpenStreetMap). Gratuit, sans compte ni cle API : il n'y a donc aucun secret
// a proteger, et rien de sensible ne transite par le navigateur.
// Les horaires viennent de l'etiquette opening_hours quand elle existe.
import { interrogerOverpass } from './overpass.js';
import { composerLaRequeteDeLieux, FAMILLES, motifDuNom } from './requete-de-lieux.js';
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

const convertirUnResultat = (element) => {
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
  };
};

// Les lieux dont le nom contient le terme passent devant ceux trouves par leur
// seule categorie, et les mieux renseignes devant les autres.
const rang = (lieu, expressionDuNom) =>
  Number(expressionDuNom.test(lieu.nom)) * 2 + Number(lieu.horairesTrouves);

export const rechercherDesLieux = async (terme, centre) => {
  const elements = await interrogerOverpass(composerLaRequeteDeLieux(terme, centre));
  const expressionDuNom = new RegExp(motifDuNom(terme), 'i');
  const vus = new Set();
  return elements
    .map(convertirUnResultat)
    .filter(Boolean)
    .filter((lieu) => !vus.has(lieu.reference) && vus.add(lieu.reference))
    .sort((premier, second) => rang(second, expressionDuNom) - rang(premier, expressionDuNom))
    .slice(0, NOMBRE_MAXIMAL_DE_RESULTATS);
};
