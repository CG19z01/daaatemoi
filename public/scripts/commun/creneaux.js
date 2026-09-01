// Regles de choix d'une heure, cote navigateur. Elles reprennent exactement
// celles du serveur, qui reste seul juge : ici, elles servent a ne proposer que
// des heures valables, pour eviter une saisie refusee ensuite.
//
// - les minutes vont de 5 en 5 ;
// - un creneau peut commencer 2 h avant l'ouverture ;
// - il s'arrete au plus tard 1 h avant la fermeture ;
// - plusieurs plages dans la journee sont gerees separement.
export const PAS_DES_MINUTES = 5;
const MINUTES_PAR_JOUR = 24 * 60;
const AVANCE_AVANT_OUVERTURE = 120;
const RECUL_AVANT_FERMETURE = 60;

export const JOURS_DE_LA_SEMAINE = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];

export const enMinutes = (heure) => {
  const [heures, minutes] = String(heure).split(':').map(Number);
  return heures * 60 + minutes;
};

export const enHeure = (minutes) => {
  const ramenees = ((minutes % MINUTES_PAR_JOUR) + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR;
  return `${String(Math.floor(ramenees / 60)).padStart(2, '0')}:${String(ramenees % 60).padStart(2, '0')}`;
};

// Toutes les heures de la journee, de 5 en 5 minutes.
const TOUS_LES_CRENEAUX = Array.from(
  { length: MINUTES_PAR_JOUR / PAS_DES_MINUTES },
  (rien, rang) => enHeure(rang * PAS_DES_MINUTES),
);

const plageAutorisee = ({ ouverture, fermeture }) => {
  const debutDOuverture = enMinutes(ouverture);
  const finDOuverture = enMinutes(fermeture);
  const finReelle =
    finDOuverture <= debutDOuverture ? finDOuverture + MINUTES_PAR_JOUR : finDOuverture;
  const debut = Math.max(0, debutDOuverture - AVANCE_AVANT_OUVERTURE);
  const fin = finReelle - RECUL_AVANT_FERMETURE;
  return fin >= debut ? { debut, fin } : null;
};

// null : aucune contrainte. [] : ferme ce jour-la.
export const plagesDeCreneaux = (horairesDuJour) => {
  if (!Array.isArray(horairesDuJour)) return null;
  return horairesDuJour.map(plageAutorisee).filter(Boolean);
};

export const heureDansLesPlages = (plages, heure) => {
  if (plages === null) return true;
  const demandee = enMinutes(heure);
  return plages.some(
    ({ debut, fin }) =>
      (demandee >= debut && demandee <= fin) ||
      (demandee + MINUTES_PAR_JOUR >= debut && demandee + MINUTES_PAR_JOUR <= fin),
  );
};

export const creneauxAutorises = (plages) =>
  plages === null
    ? TOUS_LES_CRENEAUX
    : TOUS_LES_CRENEAUX.filter((heure) => heureDansLesPlages(plages, heure));

export const heuresPossibles = (plages) => [
  ...new Set(creneauxAutorises(plages).map((creneau) => creneau.slice(0, 2))),
];

export const minutesPossibles = (plages, heures) =>
  creneauxAutorises(plages)
    .filter((creneau) => creneau.startsWith(`${heures}:`))
    .map((creneau) => creneau.slice(3));

// Nom du jour ("lundi", ...) pour une date AAAA-MM-JJ.
export const nomDuJourDeLaDate = (dateIso) => {
  const instant = new Date(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(instant.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long' })
    .format(instant)
    .toLowerCase();
};
