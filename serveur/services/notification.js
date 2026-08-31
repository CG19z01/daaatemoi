// Notification d'un nouveau rendez-vous, envoyee uniquement depuis le serveur.
// Service ntfy : le sujet tient lieu de secret, il ne quitte jamais cette couche.
import { configuration } from '../config.js';
import { formaterUneDateIso } from '../utilitaires/date-paris.js';

const TITRE_DU_RENDEZ_VOUS = 'Nouveau date 💜';
const TITRE_DE_LA_PROPOSITION = 'Autre endroit proposé 💜';
// Le premier appel sortant d'une instance froide est lent : on laisse du temps,
// et on retente une fois pour absorber un incident passager.
const DELAI_MAXIMAL_EN_MILLISECONDES = 6000;
const TENTATIVES = 2;
const PAUSE_ENTRE_TENTATIVES = 400;
const SUJET_VALIDE = /^[A-Za-z0-9_-]{6,64}$/;

export const notificationsConfigurees = () => SUJET_VALIDE.test(configuration.sujetDeNotification);

const composerLeMessage = (rendezVous) =>
  [
    'Nouveau rendez-vous !',
    '',
    rendezVous.nomDuLieu,
    `${formaterUneDateIso(rendezVous.dateDeReservation)} à ${rendezVous.heureDeReservation}`,
  ].join('\n');

// Le jeton n'est ajoute que si l'instance en demande un (cas auto-heberge).
const entetes = () => {
  const entetesDeBase = { 'Content-Type': 'application/json' };
  if (!configuration.jetonDeNotification) return entetesDeBase;
  return { ...entetesDeBase, Authorization: `Bearer ${configuration.jetonDeNotification}` };
};

const attendre = (duree) => new Promise((terminer) => setTimeout(terminer, duree));

const tenterUnEnvoi = async (corps) => {
  const reponse = await fetch(configuration.serveurDeNotification, {
    method: 'POST',
    headers: entetes(),
    body: JSON.stringify(corps),
    signal: AbortSignal.timeout(DELAI_MAXIMAL_EN_MILLISECONDES),
  });
  if (!reponse.ok) throw new Error(`statut ${reponse.status}`);
};

// Ne leve jamais d'erreur : l'appelant decide quoi faire d'un envoi manque.
export const envoyerUneNotification = async ({ titre, message, etiquette }) => {
  if (!notificationsConfigurees()) {
    return { envoyee: false, raison: 'notifications non configurees' };
  }
  const corps = {
    topic: configuration.sujetDeNotification,
    title: titre,
    message,
    tags: [etiquette],
  };
  let dernierProbleme = 'inconnu';
  for (let tentative = 1; tentative <= TENTATIVES; tentative += 1) {
    try {
      await tenterUnEnvoi(corps);
      return { envoyee: true };
    } catch (erreur) {
      // Seul le type d'erreur est journalise, jamais le sujet ni la requete.
      dernierProbleme = erreur.name === 'Error' ? erreur.message : erreur.name;
      console.error(`Notification, tentative ${tentative}/${TENTATIVES} : ${dernierProbleme}`);
      if (tentative < TENTATIVES) await attendre(PAUSE_ENTRE_TENTATIVES);
    }
  }
  return { envoyee: false, raison: dernierProbleme };
};

export const prevenirDUnRendezVous = (rendezVous) =>
  envoyerUneNotification({
    titre: TITRE_DU_RENDEZ_VOUS,
    message: composerLeMessage(rendezVous),
    etiquette: 'calendar',
  });

// "AUTRE ENDROIT PROPOSE" : lieu, date, heure et instant de reception.
export const prevenirDUneProposition = (proposition) =>
  envoyerUneNotification({
    titre: TITRE_DE_LA_PROPOSITION,
    message: [
      'AUTRE ENDROIT PROPOSÉ',
      '',
      `Lieu : ${proposition.nomDuLieu}`,
      `Date : ${formaterUneDateIso(proposition.dateProposee)}`,
      `Heure : ${proposition.heureProposee}`,
      '',
      `Reçu le : ${proposition.horodatage}`,
    ].join('\n'),
    etiquette: 'round_pushpin',
  });
