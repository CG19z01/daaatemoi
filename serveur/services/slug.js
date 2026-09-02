// Adresse personnalisee d'une experience : trois mots romantiques separes par
// des tirets. Le tirage se fait cote serveur uniquement : le navigateur ne
// choisit jamais son adresse.
import { randomInt } from 'node:crypto';
import { motsRomantiques, motsReconnaissables } from '../donnees/mots-romantiques.js';

const NOMBRE_DE_MOTS = 3;

// Le lien partage ajoute ce suffixe a l'adresse a trois mots.
export const SUFFIXE_DU_LIEN = '-for-you';

// Exactement trois mots separes par des tirets. Un mot est fait de lettres
// latines ; une expression qui en compte plusieurs les relie par un tiret bas,
// qui ne se confond donc jamais avec le tiret separant les trois mots.
const MOT = '[a-z]+(?:_[a-z]+)*';
export const SLUG_VALIDE = new RegExp(`^(?=.{2,20}(?:-|$))${MOT}(?:-(?=.{2,20}(?:-|$))${MOT}){2}$`);

// Accents retires, tout caractere hors alphabet latin ecarte : un mot venu
// d'une autre ecriture ne peut pas se glisser dans une adresse. Le tiret bas,
// lui, est conserve : il relie les morceaux d'une expression.
export const normaliserUnMot = (mot) =>
  String(mot)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z_]/g, '')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');

const utilisable = (mot) =>
  mot.length >= 2 && mot.length <= 20 && /^[a-z]+(?:_[a-z]+)*$/.test(mot);

const vocabulaire = [...new Set(motsRomantiques.map(normaliserUnMot))].filter(utilisable);

// Sous-ensemble des langues qu un francophone reconnait. Chaque adresse en
// contient au moins un mot : sans cela, un lien sur trois n aurait offert aucun
// repere a la personne qui le recoit.
const vocabulaireReconnaissable = [
  ...new Set(motsReconnaissables.map(normaliserUnMot)),
].filter(utilisable);

export const nombreDeMotsDisponibles = () => vocabulaire.length;

// Une banque vide ne permettrait aucun tirage. On le dit clairement plutot que
// de laisser la requete echouer sans explication.
if (vocabulaire.length === 0 || vocabulaireReconnaissable.length === 0) {
  throw new Error(
    `Banque de mots vide : ${vocabulaire.length} mot(s), dont ` +
      `${vocabulaireReconnaissable.length} reconnaissable(s).`,
  );
}

const tirer = (liste) => liste[randomInt(liste.length)];

// Melange de Fisher-Yates : le mot reconnaissable ne tombe pas toujours en tete.
const melanger = (mots) => {
  const melanges = [...mots];
  for (let rang = melanges.length - 1; rang > 0; rang -= 1) {
    const autre = randomInt(rang + 1);
    [melanges[rang], melanges[autre]] = [melanges[autre], melanges[rang]];
  }
  return melanges;
};

// Trois mots tires au sort de maniere cryptographique. Le premier vient d une
// langue reconnaissable, les deux autres de toute la banque, puis l ordre est
// melange.
//
// Un meme mot peut sortir deux ou trois fois : amour-amour-cuore est une
// adresse parfaitement valable. C est rare — environ une sur six cents — et
// rien ne justifie de l ecarter, l unicite de l adresse etant garantie par le
// stockage, pas par la distinction des mots.
export const composerUnSlug = () => {
  const choisis = [tirer(vocabulaireReconnaissable)];
  while (choisis.length < NOMBRE_DE_MOTS) choisis.push(tirer(vocabulaire));
  return melanger(choisis).join('-');
};

// Adresse complete partagee a l'invite.
export const composerLeLien = (slug) => `/${slug}${SUFFIXE_DU_LIEN}`;

// Retrouve le slug depuis un chemin "/amour-luna-cuore-for-you".
// Renvoie null des que la forme n'est pas exactement celle attendue.
export const extraireLeSlug = (segment) => {
  if (typeof segment !== 'string' || !segment.endsWith(SUFFIXE_DU_LIEN)) return null;
  const slug = segment.slice(0, -SUFFIXE_DU_LIEN.length);
  return SLUG_VALIDE.test(slug) ? slug : null;
};
