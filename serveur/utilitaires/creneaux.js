// Regles de choix d'un creneau horaire.
//
// - les minutes vont de 5 en 5, jamais autrement ;
// - un creneau peut commencer jusqu'a 2 heures avant l'ouverture du lieu ;
// - il ne peut pas commencer apres 1 heure avant la fermeture ;
// - un lieu ouvert en plusieurs fois dans la journee donne plusieurs plages ;
// - une plage trop courte pour respecter ces marges est simplement ecartee,
//   plutot que de proposer un horaire incoherent.
//
// Sans horaires connus, aucune contrainte n'est imposee : l'utilisateur reste
// libre, comme demande.
export const PAS_DES_MINUTES = 5;
const MINUTES_PAR_JOUR = 24 * 60;
const AVANCE_AVANT_OUVERTURE = 120;
const RECUL_AVANT_FERMETURE = 60;

export const EXPRESSION_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const enMinutes = (heure) => {
  const [heures, minutes] = String(heure).split(':').map(Number);
  return heures * 60 + minutes;
};

export const enHeure = (minutes) => {
  const ramenees = ((minutes % MINUTES_PAR_JOUR) + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR;
  const heures = Math.floor(ramenees / 60);
  return `${String(heures).padStart(2, '0')}:${String(ramenees % 60).padStart(2, '0')}`;
};

export const minutesRespectentLePas = (heure) => enMinutes(heure) % PAS_DES_MINUTES === 0;

// Une plage d'ouverture devient une plage de debut de creneau autorise.
// Les minutes peuvent depasser 1440 quand le lieu ferme apres minuit.
const plageAutorisee = ({ ouverture, fermeture }) => {
  const debutDOuverture = enMinutes(ouverture);
  const finDOuverture = enMinutes(fermeture);
  const finReelle = finDOuverture <= debutDOuverture ? finDOuverture + MINUTES_PAR_JOUR : finDOuverture;
  const debut = Math.max(0, debutDOuverture - AVANCE_AVANT_OUVERTURE);
  const fin = finReelle - RECUL_AVANT_FERMETURE;
  return fin >= debut ? { debut, fin } : null;
};

// null si le jour n'a pas d'horaires connus : aucune contrainte alors.
// [] si le lieu est ferme : aucun creneau n'est possible.
export const plagesDeCreneaux = (horairesDuJour) => {
  if (!Array.isArray(horairesDuJour)) return null;
  return horairesDuJour.map(plageAutorisee).filter(Boolean);
};

// Vrai si l'heure demandee tombe dans l'une des plages autorisees.
export const heureDansLesPlages = (plages, heure) => {
  if (plages === null) return true;
  const demandee = enMinutes(heure);
  return plages.some(
    ({ debut, fin }) =>
      (demandee >= debut && demandee <= fin) ||
      (demandee + MINUTES_PAR_JOUR >= debut && demandee + MINUTES_PAR_JOUR <= fin),
  );
};
