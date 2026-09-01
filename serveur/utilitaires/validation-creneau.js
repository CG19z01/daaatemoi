// Validation d'un creneau : date, heure de debut, heure de fin, et respect des
// horaires du lieu concerne. Les memes regles servent aux disponibilites du
// createur et aux propositions de l'invite.
import {
  EXPRESSION_HEURE,
  enMinutes,
  minutesRespectentLePas,
  plagesDeCreneaux,
  heureDansLesPlages,
} from './creneaux.js';
import { nomDuJour, dateDuJourAParis } from './date-paris.js';
import { nettoyerTexte } from './validation.js';

const EXPRESSION_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MINUTES_PAR_JOUR = 24 * 60;
const DUREE_MINIMALE = 15;
const DUREE_MAXIMALE = 8 * 60;

// Renvoie { date } ou { erreur }. Un 31 fevrier glisse sur mars : on verifie
// que la date relue correspond bien a celle demandee.
export const validerUneDate = (valeurRecue) => {
  const date = nettoyerTexte(valeurRecue, 10);
  if (!date) return { erreur: 'Veuillez indiquer une date.' };
  if (!EXPRESSION_DATE.test(date)) return { erreur: 'Date invalide.' };
  const relue = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(relue.getTime()) || !relue.toISOString().startsWith(date)) {
    return { erreur: 'Date invalide.' };
  }
  if (date < dateDuJourAParis()) return { erreur: 'Cette date est déjà passée.' };
  return { date };
};

export const validerUneHeure = (valeurRecue) => {
  const heure = nettoyerTexte(valeurRecue, 5);
  if (!EXPRESSION_HEURE.test(heure)) return { erreur: 'Heure invalide.' };
  if (!minutesRespectentLePas(heure)) return { erreur: 'Les minutes vont de 5 en 5.' };
  return { heure };
};

// Le lieu impose ses horaires : rien ne peut sortir des plages autorisees.
const respecteLeLieu = (lieu, date, heures) => {
  if (!lieu?.horaires) return null;
  const jour = nomDuJour(date);
  const plages = plagesDeCreneaux(lieu.horaires[jour]);
  if (plages === null) return null;
  if (plages.length === 0) return `${lieu.nom} est fermé le ${jour}.`;
  const horsPlage = heures.find((heure) => !heureDansLesPlages(plages, heure));
  return horsPlage ? `${horsPlage} ne correspond pas aux horaires de ${lieu.nom}.` : null;
};

// Renvoie { creneau } ou { erreur }.
export const validerUnCreneau = (creneauRecu, lieux = []) => {
  const { erreur: erreurDeDate, date } = validerUneDate(creneauRecu?.date);
  if (erreurDeDate) return { erreur: erreurDeDate };
  const { erreur: erreurDeDebut, heure: heureDeDebut } = validerUneHeure(creneauRecu?.heureDeDebut);
  if (erreurDeDebut) return { erreur: erreurDeDebut };
  const { erreur: erreurDeFin, heure: heureDeFin } = validerUneHeure(creneauRecu?.heureDeFin);
  if (erreurDeFin) return { erreur: erreurDeFin };

  // Une fin plus petite que le debut passe simplement minuit.
  const duree =
    (enMinutes(heureDeFin) - enMinutes(heureDeDebut) + MINUTES_PAR_JOUR) % MINUTES_PAR_JOUR;
  if (duree < DUREE_MINIMALE) return { erreur: 'Le créneau doit durer au moins 15 minutes.' };
  if (duree > DUREE_MAXIMALE) return { erreur: 'Le créneau ne peut pas dépasser 8 heures.' };

  const identifiantDuLieu = nettoyerTexte(creneauRecu?.identifiantDuLieu, 40) || null;
  const lieu = identifiantDuLieu
    ? lieux.find((candidat) => candidat.identifiant === identifiantDuLieu)
    : null;
  if (identifiantDuLieu && !lieu) return { erreur: 'Ce lieu n’existe pas.' };

  const erreurDHoraire = respecteLeLieu(lieu, date, [heureDeDebut, heureDeFin]);
  if (erreurDHoraire) return { erreur: erreurDHoraire };

  return { creneau: { date, heureDeDebut, heureDeFin, identifiantDuLieu } };
};
