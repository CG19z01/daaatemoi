// Vérifications de la banque de mots : ce qu'elle contient, et ce qu'elle
// produit une fois tirée au sort.
import { verifier, titre } from './outils-de-test.js';
import { motsRomantiques, motsReconnaissables } from '../serveur/donnees/mots-romantiques.js';
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

export const verifierLeRepereReconnaissable = () => {
  titre('Un repère reconnaissable dans chaque adresse');
  const reconnus = new Set(motsReconnaissables);
  verifier(reconnus.size > 100, `la réserve reconnaissable est fournie (${reconnus.size} mots)`);
  verifier(
    motsReconnaissables.every((mot) => motsRomantiques.includes(mot)),
    'elle est bien un sous-ensemble de la banque',
  );

  const tirages = Array.from({ length: 2000 }, () => composerUnSlug());
  verifier(
    tirages.every((slug) => slug.split('-').some((mot) => reconnus.has(mot))),
    'aucune adresse n’est composée de trois mots inconnus d’un francophone',
  );

  // Sans mélange, le repère tomberait toujours en tête : ce serait un tic.
  const places = new Set();
  for (const slug of tirages) {
    slug.split('-').forEach((mot, rang) => {
      if (reconnus.has(mot)) places.add(rang);
    });
  }
  verifier(places.size === 3, 'il ne tombe pas toujours à la même place');
};

export const verifierLaRepetitionAutorisee = () => {
  titre('Un mot peut se répéter dans une adresse');
  verifier(SLUG_VALIDE.test('amour-amour-cuore'), 'deux fois le même mot forme une adresse valable');
  verifier(SLUG_VALIDE.test('amour-amour-amour'), 'trois fois le même mot également');
  verifier(
    extraireLeSlug('amour-amour-cuore-for-you') === 'amour-amour-cuore',
    'le lien correspondant se relit sans perdre la répétition',
  );

  // Environ une adresse sur cinq cents : quelques dizaines sont attendues ici,
  // et n en voir aucune signifierait que le tirage les écarte à nouveau.
  const tirages = Array.from({ length: 30000 }, () => composerUnSlug());
  const avecRepetition = tirages.filter((slug) => new Set(slug.split('-')).size < 3).length;
  verifier(
    avecRepetition > 0,
    `le tirage en produit réellement (${avecRepetition} sur 30 000)`,
  );
};
