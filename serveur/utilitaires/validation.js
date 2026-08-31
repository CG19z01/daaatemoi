// Validation stricte cote serveur : rien de ce qui vient du navigateur n'est fiable.
import { trouverLieu } from '../donnees/lieux.js';
import { nomDuJour, dateDuJourAParis } from './date-paris.js';
import { verifierLHoraire } from './horaires.js';

const EXPRESSION_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EXPRESSION_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const CARACTERES_INTERDITS = /[\x00-\x1f<>]/g;

export const nettoyerTexte = (valeur, longueurMaximale = 80) => {
  if (typeof valeur !== 'string') return '';
  return valeur.replace(CARACTERES_INTERDITS, '').trim().slice(0, longueurMaximale);
};

// Verifie une demande de reservation et renvoie { erreur } ou { reservation }.
export const validerReservation = (corpsRecu) => {
  const identifiantDuLieu = nettoyerTexte(corpsRecu?.identifiantDuLieu, 60);
  const dateDeReservation = nettoyerTexte(corpsRecu?.dateDeReservation, 10);
  const heureDeReservation = nettoyerTexte(corpsRecu?.heureDeReservation, 5);

  const lieu = trouverLieu(identifiantDuLieu);
  if (!lieu) return { erreur: 'Ce lieu n existe pas.' };
  if (!EXPRESSION_DATE.test(dateDeReservation)) return { erreur: 'Date invalide.' };
  if (!EXPRESSION_HEURE.test(heureDeReservation)) return { erreur: 'Heure invalide.' };
  if (dateDeReservation < dateDuJourAParis()) return { erreur: 'Cette date est deja passee.' };

  const jour = nomDuJour(dateDeReservation);
  if (!jour) return { erreur: 'Date invalide.' };
  const { erreur } = verifierLHoraire(lieu, jour, heureDeReservation);
  if (erreur) return { erreur };
  return { reservation: { lieu, dateDeReservation, heureDeReservation } };
};
