// Proposition d'un autre lieu : on journalise, on place le point, puis on previent.
// La proposition est conservee meme si la notification echoue : perdre le point
// place par le visiteur serait pire qu'une notification manquee.
import { enregistrerUneProposition } from './journal.js';
import { prevenirDUneProposition } from './notification.js';
import { ajouterUnLieuPropose } from './lieux-proposes.js';

export const traiterUneProposition = async (proposition, identifiantDeSession) => {
  const trace = await enregistrerUneProposition(proposition, identifiantDeSession);
  const lieuAjoute = await ajouterUnLieuPropose(proposition);
  const { envoyee, raison } = await prevenirDUneProposition(trace);
  return { trace, envoyee, raison, lieuAjoute };
};
