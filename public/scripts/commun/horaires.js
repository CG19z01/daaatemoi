// Affichage des horaires d'une experience.
//   null -> non renseignes    [] -> ferme    [{ouverture, fermeture}] -> plages
import { JOURS_DE_LA_SEMAINE } from './creneaux.js';

export { JOURS_DE_LA_SEMAINE };

export const libelleDuJour = (jour) => jour.charAt(0).toUpperCase() + jour.slice(1);

export const libelleDesHoraires = (horairesDuJour) => {
  if (!Array.isArray(horairesDuJour)) return 'Non renseignés';
  if (horairesDuJour.length === 0) return 'Fermé';
  return horairesDuJour
    .map((plage) => `${plage.ouverture} – ${plage.fermeture}`)
    .join(', ');
};

// Resume court pour la liste des lieux : "Ouvert 5 jours sur 7".
export const resumeDesHoraires = (horaires) => {
  if (!horaires) return 'Horaires à compléter';
  const ouverts = JOURS_DE_LA_SEMAINE.filter((jour) => (horaires[jour] ?? []).length > 0).length;
  if (ouverts === 0) return 'Horaires à compléter';
  return `Ouvert ${ouverts} jour${ouverts > 1 ? 's' : ''} sur 7`;
};

export const horairesVides = () =>
  Object.fromEntries(JOURS_DE_LA_SEMAINE.map((jour) => [jour, null]));
