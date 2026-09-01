// Hachage des mots de passe des experiences.
// scrypt (node:crypto) est une fonction de derivation concue pour les mots de
// passe : lente et couteuse en memoire, donc resistante aux attaques par carte
// graphique, au meme titre qu'Argon2 ou bcrypt. Elle est fournie par Node, ce
// qui evite une dependance native mal supportee par les fonctions serverless.
// Un simple SHA-256, du base64 ou un chiffrement reversible seraient inaptes.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriver = promisify(scrypt);

const COUT = 2 ** 15;
const BLOC = 8;
const PARALLELISME = 1;
const OCTETS_DU_SEL = 16;
const OCTETS_DE_L_EMPREINTE = 32;
// scrypt reclame environ 128 * N * r octets : la limite par defaut de Node
// (32 Mo) est juste en dessous, on la releve explicitement.
const MEMOIRE_MAXIMALE = 96 * 1024 * 1024;

export const LONGUEUR_MINIMALE_DU_MOT_DE_PASSE = 8;
export const LONGUEUR_MAXIMALE_DU_MOT_DE_PASSE = 128;

const parametres = (cout, bloc, parallelisme) => ({
  N: cout,
  r: bloc,
  p: parallelisme,
  maxmem: MEMOIRE_MAXIMALE,
});

// Format stocke : scrypt$N$r$p$sel$empreinte, le tout en base64url.
export const hacherLeMotDePasse = async (motDePasse) => {
  const sel = randomBytes(OCTETS_DU_SEL);
  const empreinte = await deriver(
    String(motDePasse).normalize('NFKC'),
    sel,
    OCTETS_DE_L_EMPREINTE,
    parametres(COUT, BLOC, PARALLELISME),
  );
  return [
    'scrypt',
    COUT,
    BLOC,
    PARALLELISME,
    sel.toString('base64url'),
    empreinte.toString('base64url'),
  ].join('$');
};

// Compare a temps constant. Renvoie faux plutot que de lever : une empreinte
// abimee ne doit jamais ouvrir l'acces ni faire tomber la requete.
export const verifierLeMotDePasse = async (motDePasse, empreinteStockee) => {
  if (typeof motDePasse !== 'string' || typeof empreinteStockee !== 'string') return false;
  const [algorithme, cout, bloc, parallelisme, sel, empreinte] = empreinteStockee.split('$');
  if (algorithme !== 'scrypt' || !sel || !empreinte) return false;
  try {
    const attendue = Buffer.from(empreinte, 'base64url');
    const calculee = await deriver(
      motDePasse.normalize('NFKC'),
      Buffer.from(sel, 'base64url'),
      attendue.length,
      parametres(Number(cout), Number(bloc), Number(parallelisme)),
    );
    return timingSafeEqual(attendue, calculee);
  } catch {
    return false;
  }
};
