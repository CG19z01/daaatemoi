// Lieux places sur la carte par les visiteurs. Collection distincte de la liste
// choisie : celle-ci reste en lecture seule et n'est jamais modifiable de l'exterieur.
import { entrepot } from './entrepot.js';
import { genererIdentifiantAleatoire } from '../utilitaires/signature.js';

const NOM_DES_LIEUX_PROPOSES = 'lieux-proposes';
const NOMBRE_MAXIMAL_AFFICHE = 30;

export const ajouterUnLieuPropose = async (proposition) => {
  if (!proposition.position) return null;
  return entrepot.ajouterDansCollection(NOM_DES_LIEUX_PROPOSES, {
    identifiant: genererIdentifiantAleatoire(),
    nom: proposition.lieuPropose,
    latitude: proposition.position.latitude,
    longitude: proposition.position.longitude,
    couleur: proposition.couleur,
    dateProposee: proposition.dateProposee,
    heureProposee: proposition.heureProposee,
  });
};

// Rattrapage des points enregistres avant l'arrivee des identifiants :
// sans identifiant, l'administration ne pourrait pas les retirer.
const completerLesIdentifiants = async (lieux) => {
  if (lieux.every((lieu) => lieu.identifiant)) return lieux;
  const completes = lieux.map((lieu) =>
    lieu.identifiant ? lieu : { ...lieu, identifiant: genererIdentifiantAleatoire() },
  );
  await entrepot.remplacerLaCollection(NOM_DES_LIEUX_PROPOSES, completes);
  return completes;
};

// Les plus recents d'abord, et en nombre borne pour ne pas surcharger la carte.
export const recupererLesLieuxProposes = async () => {
  const lieux = await completerLesIdentifiants(
    await entrepot.lireCollection(NOM_DES_LIEUX_PROPOSES),
  );
  return lieux.slice(-NOMBRE_MAXIMAL_AFFICHE).reverse();
};

// Retire un point de la carte. Renvoie vrai si un point a bien ete retire.
export const supprimerUnLieuPropose = async (identifiant) => {
  const lieux = await entrepot.lireCollection(NOM_DES_LIEUX_PROPOSES);
  const restants = lieux.filter((lieu) => lieu.identifiant !== identifiant);
  if (restants.length === lieux.length) return false;
  await entrepot.remplacerLaCollection(NOM_DES_LIEUX_PROPOSES, restants);
  return true;
};
