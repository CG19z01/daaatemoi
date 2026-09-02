// Documents JSON sur disque : un fichier par cle. Complete stockage.js,
// qui ne sait manipuler que des collections. Sert uniquement en developpement.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { dossierRacine } from '../chemins.js';

const dossierDesDocuments = join(dossierRacine, 'donnees', 'documents');
// Une cle ne contient que des minuscules, des chiffres, des tirets et des
// tirets bas : aucun chemin ne peut donc etre remonte depuis une valeur
// exterieure. Le tiret bas vient des expressions en plusieurs mots des adresses.
const CLE_VALIDE = /^[a-z0-9_-]{1,120}$/;

const cheminDuDocument = (cle) => {
  if (!CLE_VALIDE.test(cle)) throw new Error('Cle de document invalide.');
  return join(dossierDesDocuments, `${cle}.json`);
};

export const lireDocument = async (cle) => {
  try {
    return JSON.parse(await readFile(cheminDuDocument(cle), 'utf8'));
  } catch {
    return null;
  }
};

export const ecrireDocument = async (cle, valeur) => {
  const chemin = cheminDuDocument(cle);
  await mkdir(dossierDesDocuments, { recursive: true });
  await writeFile(chemin, JSON.stringify(valeur), 'utf8');
  return valeur;
};

// Ecriture exclusive : echoue si la cle existe deja. C'est ce qui garantit
// l'unicite d'un slug sans avoir a lire puis ecrire en deux temps.
export const creerDocumentSiAbsent = async (cle, valeur) => {
  const chemin = cheminDuDocument(cle);
  await mkdir(dossierDesDocuments, { recursive: true });
  try {
    await writeFile(chemin, JSON.stringify(valeur), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
};

export const listerLesCles = async (prefixe) => {
  try {
    const fichiers = await readdir(dossierDesDocuments);
    return fichiers
      .filter((nom) => nom.endsWith('.json') && nom.startsWith(prefixe))
      .map((nom) => nom.slice(0, -'.json'.length));
  } catch {
    return [];
  }
};
