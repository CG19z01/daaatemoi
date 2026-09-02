// Adresse personnalisee d'une experience : trois mots romantiques separes par
// des tirets. Le tirage se fait cote serveur uniquement : le navigateur ne
// choisit jamais son adresse.
import { randomInt } from 'node:crypto';
import { motsRomantiques } from '../donnees/mots-romantiques.js';

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

const vocabulaire = [...new Set(motsRomantiques.map(normaliserUnMot))].filter(
  (mot) => mot.length >= 2 && mot.length <= 20 && /^[a-z]+(?:_[a-z]+)*$/.test(mot),
);

export const nombreDeMotsDisponibles = () => vocabulaire.length;

// Trois mots distincts sont necessaires : en dessous, le tirage tournerait sans
// fin. On le dit clairement plutot que de laisser la requete se figer.
if (vocabulaire.length < NOMBRE_DE_MOTS) {
  throw new Error(`Banque de mots trop courte : ${vocabulaire.length} mot(s) utilisable(s).`);
}

// Trois mots distincts, tires au sort de maniere cryptographique.
export const composerUnSlug = () => {
  const choisis = [];
  while (choisis.length < NOMBRE_DE_MOTS) {
    const mot = vocabulaire[randomInt(vocabulaire.length)];
    if (!choisis.includes(mot)) choisis.push(mot);
  }
  return choisis.join('-');
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
