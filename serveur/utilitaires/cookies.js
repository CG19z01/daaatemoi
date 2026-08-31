// Lecture et ecriture de cookies sans dependance externe.
import { configuration } from '../config.js';

export const lireCookie = (requete, nom) => {
  const entete = requete.headers.cookie;
  if (!entete) return null;
  for (const morceau of entete.split(';')) {
    const separateur = morceau.indexOf('=');
    if (separateur === -1) continue;
    if (morceau.slice(0, separateur).trim() === nom) {
      return decodeURIComponent(morceau.slice(separateur + 1).trim());
    }
  }
  return null;
};

export const deposerCookie = (reponse, nom, valeur, dureeEnSecondes) => {
  const options = [
    `${nom}=${encodeURIComponent(valeur)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${dureeEnSecondes}`,
  ];
  if (configuration.enProduction) options.push('Secure');
  reponse.append('Set-Cookie', options.join('; '));
};

export const supprimerCookie = (reponse, nom) => deposerCookie(reponse, nom, '', 0);
