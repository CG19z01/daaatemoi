// Identite du visiteur : un simple cookie signe, sans aucune exclusivite.
// Plusieurs personnes peuvent utiliser le site en meme temps.
import { signerJeton, verifierJeton, genererIdentifiantAleatoire } from '../utilitaires/signature.js';
import { lireCookie, deposerCookie } from '../utilitaires/cookies.js';

const NOM_DU_COOKIE = 'session_visiteur';
const DUREE_DU_COOKIE_EN_SECONDES = 3600;

const lireIdentifiantDeSession = (requete) => {
  const contenu = verifierJeton(lireCookie(requete, NOM_DU_COOKIE));
  return contenu && typeof contenu.identifiant === 'string' ? contenu.identifiant : null;
};

// Reconnait le visiteur, ou lui attribue une identite s'il n'en a pas encore.
// Sert uniquement a distinguer les visiteurs dans le journal des clics.
export const identifierLeVisiteur = (requete, reponse, suite) => {
  const identifiant = lireIdentifiantDeSession(requete) ?? genererIdentifiantAleatoire();
  deposerCookie(reponse, NOM_DU_COOKIE, signerJeton({ identifiant }), DUREE_DU_COOKIE_EN_SECONDES);
  requete.identifiantDeSession = identifiant;
  suite();
};
