// Vocabulaire romantique servant a composer les adresses des experiences.
//
// Les mots ne sont pas ecrits ici mais dans mots-romantiques.txt, a cote : une
// banque se relit et se complete beaucoup plus facilement dans un fichier texte
// que dans un tableau de code. Ajouter un mot, c est ajouter une ligne.
//
// Contrainte : uniquement des lettres latines non accentuees, pour qu une
// adresse reste tapable sur n importe quel clavier et lisible dans une URL.
// Les langues qui n utilisent pas l alphabet latin y figurent sous leur
// translitteration usuelle.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cheminDeLaBanque = join(dirname(fileURLToPath(import.meta.url)), 'mots-romantiques.txt');

// Format : un mot par ligne, [LANGUE] ouvre un bloc, # marque un commentaire.
const lireLaBanque = () => {
  const contenu = readFileSync(cheminDeLaBanque, 'utf8');
  return contenu
    .split('\n')
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne && !ligne.startsWith('#') && !ligne.startsWith('['));
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

export const motsRomantiques = chargerLaBanque();
