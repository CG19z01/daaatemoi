// Journal des interactions : clics sur un lieu et propositions d'un autre endroit,
// horodates en Europe/Paris.
import { entrepot } from './entrepot.js';
import { formaterHorodatage } from '../utilitaires/date-paris.js';

const NOM_DU_JOURNAL = 'journal-des-clics';

export const TYPE_CLIC = 'clic';
export const TYPE_AUTRE_ENDROIT = 'autre_endroit';

export const enregistrerClic = async (lieu, identifiantDeSession) => {
  const instant = new Date();
  return entrepot.ajouterDansCollection(NOM_DU_JOURNAL, {
    type: TYPE_CLIC,
    nomDuLieu: lieu.nom,
    identifiantDuLieu: lieu.identifiant,
    horodatage: formaterHorodatage(instant),
    instantIso: instant.toISOString(),
    session: identifiantDeSession.slice(0, 8),
  });
};

export const enregistrerUneProposition = async (proposition, identifiantDeSession) => {
  const instant = new Date();
  return entrepot.ajouterDansCollection(NOM_DU_JOURNAL, {
    type: TYPE_AUTRE_ENDROIT,
    nomDuLieu: proposition.lieuPropose,
    dateProposee: proposition.dateProposee,
    heureProposee: proposition.heureProposee,
    position: proposition.position ?? null,
    horodatage: formaterHorodatage(instant),
    instantIso: instant.toISOString(),
    session: identifiantDeSession.slice(0, 8),
  });
};

// Journal du plus recent au plus ancien.
export const recupererLeJournal = async () => {
  const journalDesClics = await entrepot.lireCollection(NOM_DU_JOURNAL);
  return journalDesClics.slice().reverse();
};
