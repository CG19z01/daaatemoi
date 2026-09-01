// Validation de la structure d'horaires d'une experience. Rien de ce qui vient
// du navigateur n'est repris tel quel, pas meme des horaires corriges a la main.
//
//   null  -> horaires non renseignes pour ce jour
//   []    -> ferme ce jour-la
//   [{ ouverture, fermeture }, ...] -> plages d'ouverture
import { JOURS_DE_LA_SEMAINE } from './jours.js';
import { EXPRESSION_HEURE, minutesRespectentLePas } from './creneaux.js';

const PLAGES_MAXIMALES_PAR_JOUR = 3;

const heureValide = (heure) =>
  typeof heure === 'string' && EXPRESSION_HEURE.test(heure) && minutesRespectentLePas(heure);

const nettoyerUneJournee = (valeur) => {
  if (valeur === null || valeur === undefined) return null;
  if (!Array.isArray(valeur)) return null;
  const plages = [];
  for (const plage of valeur.slice(0, PLAGES_MAXIMALES_PAR_JOUR)) {
    if (!heureValide(plage?.ouverture) || !heureValide(plage?.fermeture)) continue;
    // Une plage sans duree n'apporte rien et rendrait les creneaux absurdes.
    if (plage.ouverture === plage.fermeture) continue;
    plages.push({ ouverture: plage.ouverture, fermeture: plage.fermeture });
  }
  return plages;
};

// Renvoie toujours une structure complete : un jour absent devient non renseigne.
export const nettoyerLesHoraires = (horairesRecus) => {
  if (!horairesRecus || typeof horairesRecus !== 'object') return null;
  const horaires = {};
  let auMoinsUnJourRenseigne = false;
  for (const jour of JOURS_DE_LA_SEMAINE) {
    horaires[jour] = nettoyerUneJournee(horairesRecus[jour]);
    if (horaires[jour] !== null) auMoinsUnJourRenseigne = true;
  }
  return auMoinsUnJourRenseigne ? horaires : null;
};
