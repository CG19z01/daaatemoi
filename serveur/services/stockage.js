// Petit stockage JSON sur disque : suffisant ici, aucune base de donnees necessaire.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dossierDesDonnees = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'donnees');
const ecrituresEnCours = new Map();

const cheminDuFichier = (nomDuFichier) => join(dossierDesDonnees, `${nomDuFichier}.json`);

export const lireCollection = async (nomDuFichier) => {
  try {
    const contenu = await readFile(cheminDuFichier(nomDuFichier), 'utf8');
    const donnees = JSON.parse(contenu);
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
};

// Les ecritures d'une meme collection sont mises en file pour eviter les pertes.
const enfiler = (nomDuFichier, travail) => {
  const precedente = ecrituresEnCours.get(nomDuFichier) ?? Promise.resolve();
  const operation = precedente.then(travail);
  ecrituresEnCours.set(nomDuFichier, operation.catch(() => {}));
  return operation;
};

const ecrire = async (nomDuFichier, collection) => {
  await mkdir(dossierDesDonnees, { recursive: true });
  await writeFile(cheminDuFichier(nomDuFichier), JSON.stringify(collection, null, 2), 'utf8');
};

export const ajouterDansCollection = async (nomDuFichier, element) =>
  enfiler(nomDuFichier, async () => {
    const collection = await lireCollection(nomDuFichier);
    collection.push(element);
    await ecrire(nomDuFichier, collection);
    return element;
  });

export const remplacerLaCollection = async (nomDuFichier, elements) =>
  enfiler(nomDuFichier, async () => {
    await ecrire(nomDuFichier, elements);
    return elements;
  });
