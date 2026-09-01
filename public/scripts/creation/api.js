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
