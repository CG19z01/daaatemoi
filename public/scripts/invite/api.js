// Appels de la page invitee. L'adresse de l'experience est deduite de l'URL ;
// le serveur verifie de toute facon le cookie d'acces a chaque requete.
import { appeler, envoyer } from '../commun/appels.js';

const SUFFIXE_DU_LIEN = '-for-you';

export const adresseDeLExperience = () => {
  const chemin = decodeURIComponent(window.location.pathname).replace(/^\/+/, '');
  return chemin.endsWith(SUFFIXE_DU_LIEN) ? chemin.slice(0, -SUFFIXE_DU_LIEN.length) : '';
};

const racine = () => `/api/experiences/${encodeURIComponent(adresseDeLExperience())}`;

export const seConnecter = (motDePasse) => envoyer(`${racine()}/connexion`, { motDePasse });

export const chargerLExperience = async () => (await appeler(racine())).experience;

export const chargerLeFondDeVille = async (cle) =>
  (await appeler(`/api/creation/carte/${encodeURIComponent(cle)}`)).fond;

export const envoyerLaReponse = (reponse) => envoyer(`${racine()}/reponse`, reponse);

export const ajouterDesLieux = async (lieux) => (await envoyer(`${racine()}/lieux`, { lieux })).lieux;

export const modifierLesHoraires = async (identifiant, horaires) =>
  (await envoyer(`${racine()}/lieux/${encodeURIComponent(identifiant)}`, { horaires }, 'PATCH')).lieux;

export const recupererLeDessin = async () => (await appeler(`${racine()}/dessin`)).traits ?? [];

export const envoyerUnTrait = (trait) => envoyer(`${racine()}/dessin`, trait);
