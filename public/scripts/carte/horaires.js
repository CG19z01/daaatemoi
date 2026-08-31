// Mise en forme des horaires pour la fiche d'un lieu.
// Ces deux valeurs correspondent a celles des donnees du serveur.
const FERME = 'ferme';
const HORAIRES_NON_RENSEIGNES = 'nonRenseigne';

export const JOURS_DE_LA_SEMAINE = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];

export const formaterUneHeure = (heure) => heure.replace(':', 'h');

export const libelleDuJour = (jour) => jour.charAt(0).toUpperCase() + jour.slice(1);

// "Fermé", "Horaires non renseignés" ou "18h00 - 02h00".
export const libelleDeLHoraire = (horaireDuJour) => {
  if (horaireDuJour === FERME) return 'Fermé';
  if (!horaireDuJour || horaireDuJour === HORAIRES_NON_RENSEIGNES) {
    return 'Horaires non renseignés';
  }
  return `${formaterUneHeure(horaireDuJour.ouverture)} - ${formaterUneHeure(horaireDuJour.fermeture)}`;
};
