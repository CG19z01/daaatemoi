// Vérifications de la banque de mots : ce qu'elle contient, et ce qu'elle
// produit une fois tirée au sort.
import { verifier, titre } from './outils-de-test.js';
import { motsRomantiques } from '../serveur/donnees/mots-romantiques.js';
import { SLUG_VALIDE, extraireLeSlug, composerUnSlug } from '../serveur/services/slug.js';

export const verifierLaBanqueDeMots = () => {
  titre('Banque de mots des adresses');
  verifier(motsRomantiques.length > 500, `la banque est chargée depuis son fichier (${motsRomantiques.length} mots)`);
  verifier(
    motsRomantiques.every((mot) => /^[a-z]+(?:_[a-z]+)*$/.test(mot) && mot.length <= 20),
    'chaque mot tient en lettres latines minuscules, les expressions liées par un tiret bas',
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

export const verifierLesExpressionsLiees = () => {
  titre('Expressions tenant en plusieurs mots');
  const liees = motsRomantiques.filter((mot) => mot.includes('_'));
  verifier(liees.length > 100, `les expressions liées par un tiret bas sont là (${liees.length})`);
  verifier(
    liees.every((mot) => SLUG_VALIDE.test(`${mot}-cuore-amour`)),
    'chacune forme une adresse valable une fois placée dans un lien',
  );

  // Le tiret bas relie, il ne sépare pas : il ne doit jamais border un mot.
  const refusees = [
    ['a-b-c', 'un mot d’une seule lettre'],
    ['_leannan-cuore-amour', 'un tiret bas en tête'],
    ['leannan_-cuore-amour', 'un tiret bas en fin'],
    ['mo__leannan-cuore-amour', 'deux tirets bas à la suite'],
    ['mo_leannan-cuore', 'deux mots au lieu de trois'],
  ];
  for (const [forme, raison] of refusees) {
    verifier(!SLUG_VALIDE.test(forme), `${raison} est refusé`);
  }
};
