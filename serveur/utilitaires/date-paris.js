// Toutes les dates affichees utilisent le fuseau Europe/Paris.
const FUSEAU = 'Europe/Paris';

const formateurHorodatage = new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const formateurJour = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, weekday: 'long' });

// Rend exactement le format obligatoire : JJ/MM/AAAA HH:MM
export const formaterHorodatage = (instant = new Date()) => {
  const parties = {};
  for (const { type, value } of formateurHorodatage.formatToParts(instant)) parties[type] = value;
  return `${parties.day}/${parties.month}/${parties.year} ${parties.hour}:${parties.minute}`;
};

// Une date AAAA-MM-JJ affichee en JJ/MM/AAAA.
export const formaterUneDateIso = (dateIso) => {
  const [annee, mois, jour] = String(dateIso).split('-');
  return jour && mois && annee ? `${jour}/${mois}/${annee}` : String(dateIso);
};

// Renvoie le nom du jour ("lundi", "mardi", ...) pour une date AAAA-MM-JJ.
export const nomDuJour = (dateIso) => {
  const instant = new Date(`${dateIso}T12:00:00Z`);
  if (Number.isNaN(instant.getTime())) return null;
  return formateurJour.format(instant).toLowerCase();
};

// Date du jour a Paris au format AAAA-MM-JJ, pour refuser le passe.
export const dateDuJourAParis = () => {
  const formateur = new Intl.DateTimeFormat('fr-CA', {
    timeZone: FUSEAU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formateur.format(new Date());
};
