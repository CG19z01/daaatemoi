// Verification des horaires d'ouverture, fermeture apres minuit comprise.
import { FERME, HORAIRES_NON_RENSEIGNES } from '../donnees/lieux.js';

const enMinutes = (heure) => {
  const [heures, minutes] = heure.split(':').map(Number);
  return heures * 60 + minutes;
};

// Renvoie {} si l'heure convient, sinon { erreur }.
export const verifierLHoraire = (lieu, jour, heureDemandee) => {
  const horaireDuJour = lieu.horaires?.[jour];
  if (!horaireDuJour) return { erreur: `Horaires inconnus pour ${lieu.nom}.` };
  if (horaireDuJour === FERME) return { erreur: `${lieu.nom} est ferme le ${jour}.` };
  // Sans information fournie, aucune plage ne peut etre imposee.
  if (horaireDuJour === HORAIRES_NON_RENSEIGNES) return {};

  const demandee = enMinutes(heureDemandee);
  const ouverture = enMinutes(horaireDuJour.ouverture);
  const fermeture = enMinutes(horaireDuJour.fermeture);
  const passeMinuit = fermeture <= ouverture;
  const dansLaPlage = passeMinuit
    ? demandee >= ouverture || demandee <= fermeture
    : demandee >= ouverture && demandee <= fermeture;
  if (!dansLaPlage) {
    return { erreur: `Horaires du ${jour} : ${horaireDuJour.ouverture} - ${horaireDuJour.fermeture}.` };
  }
  return {};
};
