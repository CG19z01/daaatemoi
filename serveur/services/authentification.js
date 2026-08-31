// Authentification de l'administration : verifiee cote serveur uniquement.
import { configuration } from '../config.js';
import { signerJeton, verifierJeton, comparerSecrets } from '../utilitaires/signature.js';

export const DUREE_SESSION_ADMIN_SECONDES = 2 * 60 * 60;

export const verifierIdentifiants = (identifiant, motDePasse) => {
  const identifiantValide = comparerSecrets(identifiant ?? '', configuration.adminIdentifiant);
  const motDePasseValide = comparerSecrets(motDePasse ?? '', configuration.adminMotDePasse);
  return identifiantValide && motDePasseValide;
};

export const creerJetonAdmin = () =>
  signerJeton({
    role: 'administration',
    expiration: Date.now() + DUREE_SESSION_ADMIN_SECONDES * 1000,
  });

export const verifierAuthentification = (jeton) => {
  const contenu = verifierJeton(jeton);
  if (!contenu || contenu.role !== 'administration') return false;
  return typeof contenu.expiration === 'number' && contenu.expiration > Date.now();
};
