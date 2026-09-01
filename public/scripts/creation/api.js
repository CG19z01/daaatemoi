// Appels de la page de creation. Aucune cle ni aucun secret ici : la recherche
// de lieux et la generation des cartes passent toujours par le serveur.
import { appeler, envoyer } from '../commun/appels.js';

export const preparerLaVille = async (ville) => (await envoyer('/api/creation/ville', { ville })).ville;

export const chargerLeFondDeVille = async (cle) =>
  (await appeler(`/api/creation/carte/${encodeURIComponent(cle)}`)).fond;

export const chercherDesLieux = async (cleDeLaVille, recherche) => {
  const parametres = new URLSearchParams({ ville: cleDeLaVille, recherche });
  return (await appeler(`/api/creation/lieux?${parametres}`)).lieux ?? [];
};

export const publierLExperience = (envoi) => envoyer('/api/creation/experiences', envoi);

// Après la publication, le serveur a ouvert l'accès au créateur : il peut donc
// déposer sur sa propre carte le dessin et les textes préparés avant l'envoi.
const racineDeLExperience = (slug) => `/api/experiences/${encodeURIComponent(slug)}`;

export const deposerUnTrait = (slug, trait) => envoyer(`${racineDeLExperience(slug)}/dessin`, trait);

export const deposerLesTextes = (slug, textes) =>
  envoyer(`${racineDeLExperience(slug)}/textes`, { textes }, 'PUT');
