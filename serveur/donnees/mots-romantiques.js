// Vocabulaire romantique servant a composer les adresses des experiences.
//
// Les mots ne sont pas ecrits ici mais dans mots-romantiques.txt, a cote : une
// banque se relit et se complete beaucoup plus facilement dans un fichier texte
// que dans un tableau de code. Ajouter un mot, c est ajouter une ligne.
//
// Un bloc marque « reconnaissable » rassemble des mots qu un francophone devine,
// ou presque. Chaque adresse en contient au moins un, pour qu elle garde un
// repere quelles que soient les deux autres langues tirees.
//
// Contrainte : uniquement des lettres latines non accentuees, pour qu une
// adresse reste tapable sur n importe quel clavier et lisible dans une URL.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cheminDeLaBanque = join(dirname(fileURLToPath(import.meta.url)), 'mots-romantiques.txt');

// Format : un mot par ligne, [LANGUE] ouvre un bloc, # marque un commentaire.
const lireLaBanque = () => {
  const tous = [];
  const reconnaissables = [];
  let blocReconnaissable = false;

  for (const ligne of readFileSync(cheminDeLaBanque, 'utf8').split('\n')) {
    const nettoyee = ligne.trim();
    if (!nettoyee || nettoyee.startsWith('#')) continue;
    if (nettoyee.startsWith('[')) {
      blocReconnaissable = /\]\s+reconnaissable$/.test(nettoyee);
      continue;
    }
    tous.push(nettoyee);
    if (blocReconnaissable) reconnaissables.push(nettoyee);
  }
  return { tous, reconnaissables };
};

// La banque est lue une fois, au demarrage. Sans elle, aucune adresse ne peut
// etre composee : mieux vaut le dire tout de suite que produire des liens vides.
const chargerLaBanque = () => {
  try {
    return lireLaBanque();
  } catch (erreur) {
    throw new Error(`Banque de mots illisible (${cheminDeLaBanque}) : ${erreur.message}`);
  }
};

const banque = chargerLaBanque();

export const motsRomantiques = banque.tous;
export const motsReconnaissables = banque.reconnaissables;
