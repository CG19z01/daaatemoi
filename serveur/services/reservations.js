// Enregistrement durable des rendez-vous, un par personne.
import { entrepot } from './entrepot.js';
import { formaterHorodatage } from '../utilitaires/date-paris.js';

const NOM_DES_RESERVATIONS = 'reservations';

// Un meme lieu, a la meme date et a la meme heure, ne se reserve qu'une fois :
// un double clic ou une requete rejouee n'ajoute donc pas de doublon.
const estLeMemeRendezVous = (premier, second) =>
  premier.identifiantDuLieu === second.identifiantDuLieu &&
  premier.dateDeReservation === second.dateDeReservation &&
  premier.heureDeReservation === second.heureDeReservation;

export const enregistrerReservation = async (reservation) => {
  const { lieu, dateDeReservation, heureDeReservation } = reservation;
  const rendezVous = {
    nomDuLieu: lieu.nom,
    identifiantDuLieu: lieu.identifiant,
    dateDeReservation,
    heureDeReservation,
    horodatageDeCreation: formaterHorodatage(new Date()),
  };

  const dejaEnregistres = await entrepot.lireCollection(NOM_DES_RESERVATIONS);
  const identique = dejaEnregistres.find((existant) => estLeMemeRendezVous(existant, rendezVous));
  if (identique) return { rendezVous: identique, dejaEnregistre: true };

  await entrepot.ajouterDansCollection(NOM_DES_RESERVATIONS, rendezVous);
  return { rendezVous, dejaEnregistre: false };
};

// Du plus recent au plus ancien.
export const recupererLesReservations = async () => {
  const reservations = await entrepot.lireCollection(NOM_DES_RESERVATIONS);
  return reservations.slice().reverse();
};
