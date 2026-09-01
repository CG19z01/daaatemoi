// Validation de la reponse d'un invite : le creneau retenu parmi ceux proposes
// par le createur, et jusqu'a trois dates alternatives.
// Le creneau retenu est designe par son rang, jamais par son contenu : l'invite
// ne peut donc pas inventer une disponibilite qui n'a jamais ete proposee.
import { validerUnCreneau } from './validation-creneau.js';

export const PROPOSITIONS_MAXIMALES = 3;

const empreinteDuCreneau = (creneau) =>
  [creneau.date, creneau.heureDeDebut, creneau.heureDeFin, creneau.identifiantDuLieu ?? ''].join('|');

const validerLeChoix = (rangRecu, disponibilites) => {
  if (rangRecu === undefined || rangRecu === null || rangRecu === '') return { choix: null };
  const rang = Number(rangRecu);
  if (!Number.isInteger(rang) || rang < 0 || rang >= disponibilites.length) {
    return { erreur: 'Cette disponibilité n’existe pas.' };
  }
  return { choix: { rang, ...disponibilites[rang] } };
};

const validerLesPropositions = (propositionsRecues, lieux) => {
  if (propositionsRecues === undefined || propositionsRecues === null) return { propositions: [] };
  if (!Array.isArray(propositionsRecues)) return { erreur: 'Propositions invalides.' };
  if (propositionsRecues.length > PROPOSITIONS_MAXIMALES) {
    return { erreur: `Pas plus de ${PROPOSITIONS_MAXIMALES} propositions.` };
  }

  const propositions = [];
  const dejaVues = new Set();
  for (const creneauRecu of propositionsRecues) {
    const { erreur, creneau } = validerUnCreneau(creneauRecu, lieux);
    if (erreur) return { erreur };
    const empreinte = empreinteDuCreneau(creneau);
    if (dejaVues.has(empreinte)) return { erreur: 'Les propositions doivent être différentes.' };
    dejaVues.add(empreinte);
    propositions.push(creneau);
  }
  return { propositions };
};

// Renvoie { reponse } ou { erreur }.
export const validerLaReponse = (corpsRecu, experience) => {
  const { erreur: erreurDuChoix, choix } = validerLeChoix(
    corpsRecu?.rangDeLaDisponibilite,
    experience.disponibilites ?? [],
  );
  if (erreurDuChoix) return { erreur: erreurDuChoix };

  const { erreur: erreurDesPropositions, propositions } = validerLesPropositions(
    corpsRecu?.propositions,
    experience.lieux ?? [],
  );
  if (erreurDesPropositions) return { erreur: erreurDesPropositions };

  if (!choix && propositions.length === 0) {
    return { erreur: 'Choisis une date proposée ou propose la tienne.' };
  }
  return { reponse: { rendezVousChoisi: choix, propositions } };
};
