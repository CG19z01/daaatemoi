// Adresse publique du site, pour composer le lien partage.
// Priorite a la configuration (SITE_ADRESSE_PUBLIQUE, ou la variable fournie
// par Vercel) ; a defaut, l'hote de la requete en cours. Aucune adresse n'est
// ecrite en dur dans le code.
import { configuration } from '../config.js';

export const adressePublique = (requete) => {
  if (configuration.adressePublique) return configuration.adressePublique;
  const hote = requete.get?.('host');
  return hote ? `${requete.protocol ?? 'https'}://${hote}` : '';
};
