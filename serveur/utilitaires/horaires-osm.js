// Lecture des horaires d'ouverture d'OpenStreetMap (etiquette opening_hours).
//
// Structure produite, celle qu'utilisent les experiences :
//   { lundi: null }                              -> horaires non renseignes
//   { lundi: [] }                                -> ferme ce jour-la
//   { lundi: [{ ouverture: '10:00', fermeture: '14:00' }, ...] } -> plages
//
// La grammaire officielle d'opening_hours est tres riche ; seule la partie
// courante est comprise. Tout ce qui n'est pas reconnu reste non renseigne :
// l'utilisateur completera lui-meme, il n'est jamais bloque pour autant.
import { JOURS_DE_LA_SEMAINE } from './jours.js';
import { PAS_DES_MINUTES, enMinutes, enHeure } from './creneaux.js';

const CODES_DES_JOURS = { mo: 0, tu: 1, we: 2, th: 3, fr: 4, sa: 5, su: 6 };
const EXPRESSION_PLAGE = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]|24):[0-5]\d$/;
const TOUTE_LA_JOURNEE = [{ ouverture: '00:00', fermeture: '23:55' }];

// Tous les selecteurs du site avancent de 5 en 5 minutes : les horaires
// importes sont arrondis pour rester manipulables dans les memes champs.
const arrondirAuPas = (heure) =>
  enHeure(Math.round(enMinutes(heure) / PAS_DES_MINUTES) * PAS_DES_MINUTES);

const horairesVides = () => Object.fromEntries(JOURS_DE_LA_SEMAINE.map((jour) => [jour, null]));

// "Mo-Fr", "Sa", "Mo,We,Fr" -> indices des jours concernes.
const lireLesJours = (partie) => {
  const indices = [];
  for (const morceau of partie.split(',')) {
    const [debut, fin] = morceau.trim().toLowerCase().split('-');
    const premier = CODES_DES_JOURS[debut];
    if (premier === undefined) return null;
    const dernier = fin === undefined ? premier : CODES_DES_JOURS[fin];
    if (dernier === undefined) return null;
    // Une plage comme "Sa-Mo" repasse par la fin de semaine.
    for (let pas = 0; pas <= (dernier - premier + 7) % 7; pas += 1) {
      indices.push((premier + pas) % 7);
    }
  }
  return indices;
};

// "10:00-14:00,18:00-23:00" -> plages, ou [] pour "off"/"closed".
const lireLesPlages = (partie) => {
  const texte = partie.trim().toLowerCase();
  if (texte === 'off' || texte === 'closed') return [];
  const plages = [];
  for (const morceau of texte.split(',')) {
    const plage = morceau.trim();
    if (!EXPRESSION_PLAGE.test(plage)) return null;
    const [ouverture, fermeture] = plage.split('-');
    plages.push({
      ouverture: arrondirAuPas(ouverture),
      fermeture: arrondirAuPas(fermeture === '24:00' ? '23:55' : fermeture),
    });
  }
  return plages;
};

export const analyserLesHorairesOsm = (texte) => {
  if (typeof texte !== 'string' || texte.trim() === '') return null;
  const valeur = texte.trim();
  if (valeur === '24/7') {
    return Object.fromEntries(JOURS_DE_LA_SEMAINE.map((jour) => [jour, TOUTE_LA_JOURNEE]));
  }

  const horaires = horairesVides();
  let auMoinsUneRegleComprise = false;

  for (const regle of valeur.split(';')) {
    const separation = regle.trim().match(/^([A-Za-z,\-\s]+?)\s+(.+)$/);
    if (!separation) continue;
    const jours = lireLesJours(separation[1]);
    const plages = jours ? lireLesPlages(separation[2]) : null;
    if (!jours || plages === null) continue;
    for (const indice of jours) horaires[JOURS_DE_LA_SEMAINE[indice]] = plages;
    auMoinsUneRegleComprise = true;
  }

  return auMoinsUneRegleComprise ? horaires : null;
};
