// Acces d'un invite a une experience : un jeton signe, depose en cookie apres
// verification du mot de passe. Le jeton ne contient que l'adresse autorisee et
// sa date d'expiration ; ni le mot de passe ni son empreinte n'y figurent.
import { signerJeton, verifierJeton } from '../utilitaires/signature.js';
import { SLUG_VALIDE } from './slug.js';

export const NOM_DU_COOKIE_INVITE = 'acces_experience';
export const DUREE_DE_L_ACCES_EN_SECONDES = 12 * 60 * 60;

export const creerJetonDAcces = (slug) =>
  signerJeton({
    role: 'invite',
    slug,
    expiration: Date.now() + DUREE_DE_L_ACCES_EN_SECONDES * 1000,
  });

// Renvoie l'adresse autorisee par ce jeton, ou null.
export const adresseAutorisee = (jeton) => {
  const contenu = verifierJeton(jeton);
  if (!contenu || contenu.role !== 'invite') return null;
  if (typeof contenu.expiration !== 'number' || contenu.expiration <= Date.now()) return null;
  return typeof contenu.slug === 'string' && SLUG_VALIDE.test(contenu.slug) ? contenu.slug : null;
};
