// Vérifications de la banque de mots : ce qu'elle contient, et ce qu'elle
// produit une fois tirée au sort.
import { verifier, titre } from './outils-de-test.js';
import { motsRomantiques } from '../serveur/donnees/mots-romantiques.js';
import { SLUG_VALIDE, extraireLeSlug, composerUnSlug } from '../serveur/services/slug.js';

export const verifierLaBanqueDeMots = () => {
  titre('Banque de mots des adresses');
  verifier(motsRomantiques.length > 500, `la banque est chargée depuis son fichier (${motsRomantiques.length} mots)`);
  verifier(
    motsRomantiques.every((mot) => /^[a-z]{2,20}$/.test(mot)),
    'chaque mot tient en lettres latines minuscules, sans accent ni espace',
  );
  verifier(
    new Set(motsRomantiques).size === motsRomantiques.length,
    'aucun mot n’apparaît deux fois',
  );

  // Mille tirages : tous doivent former une adresse valable et s'y retrouver
  // une fois le suffixe du lien ajouté puis retiré.
  const tirages = Array.from({ length: 1000 }, () => composerUnSlug());
  verifier(tirages.every((slug) => SLUG_VALIDE.test(slug)), 'mille tirages donnent mille adresses valables');
  verifier(
    tirages.every((slug) => extraireLeSlug(`${slug}-for-you`) === slug),
    'chaque adresse se retrouve intacte dans son lien -for-you',
  );
};
