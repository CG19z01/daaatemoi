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

// Aperçu public : la ville seule, pour dessiner la carte derrière la demande de
// mot de passe. Aucun contenu de l'expérience n'est accessible avant connexion.
export const recupererLaVille = async () => (await appeler(`${racine()}/ville`)).ville;

export const chargerLExperience = async () => (await appeler(racine())).experience;

export const chargerLeFondDeVille = async (cle) =>
  (await appeler(`/api/creation/carte/${encodeURIComponent(cle)}`)).fond;

export const envoyerLaReponse = (reponse) => envoyer(`${racine()}/reponse`, reponse);

export const ajouterDesLieux = async (lieux) => (await envoyer(`${racine()}/lieux`, { lieux })).lieux;

// Correction d'un lieu : ses horaires, ou la couleur de son point.
export const modifierUnLieu = async (identifiant, modifications) =>
  (await envoyer(`${racine()}/lieux/${encodeURIComponent(identifiant)}`, modifications, 'PATCH'))
    .lieux;

export const recupererLesTextes = async () => (await appeler(`${racine()}/textes`)).textes ?? [];

export const enregistrerLesTextes = (textes) => envoyer(`${racine()}/textes`, { textes }, 'PUT');

export const recupererLeDessin = async () => (await appeler(`${racine()}/dessin`)).traits ?? [];

export const envoyerUnTrait = (trait) => envoyer(`${racine()}/dessin`, trait);
