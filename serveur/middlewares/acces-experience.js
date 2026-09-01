// Protection des routes d'une experience : le cookie signe doit designer
// exactement l'adresse demandee. Aucune information n'est donnee sur
// l'existence du lien : la reponse est la meme dans tous les cas de refus.
import { adresseAutorisee, NOM_DU_COOKIE_INVITE } from '../services/acces-invite.js';
import { lireCookie } from '../utilitaires/cookies.js';
import { SLUG_VALIDE } from '../services/slug.js';

export const adresseDeLExperience = (requete) => {
  const slug = requete.params?.slug;
  return typeof slug === 'string' && SLUG_VALIDE.test(slug) ? slug : null;
};

export const protegerLExperience = (requete, reponse, suite) => {
  const slug = adresseDeLExperience(requete);
  if (!slug || adresseAutorisee(lireCookie(requete, NOM_DU_COOKIE_INVITE)) !== slug) {
    return reponse.status(401).json({ erreur: 'Accès non autorisé.' });
  }
  requete.adresseDeLExperience = slug;
  return suite();
};
