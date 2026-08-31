// Protection des routes d'administration : jeton signe verifie a chaque requete.
import { verifierAuthentification } from '../services/authentification.js';
import { lireCookie } from '../utilitaires/cookies.js';

export const NOM_DU_COOKIE_ADMIN = 'session_admin';

export const estAdministrateur = (requete) =>
  verifierAuthentification(lireCookie(requete, NOM_DU_COOKIE_ADMIN));

export const protegerAdmin = (requete, reponse, suite) => {
  if (!estAdministrateur(requete)) {
    return reponse.status(401).json({ erreur: 'Authentification requise.' });
  }
  return suite();
};
