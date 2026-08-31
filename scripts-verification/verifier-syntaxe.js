// Verifie la syntaxe de tous les fichiers JavaScript du projet.
import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const lancer = promisify(execFile);
const DOSSIERS_IGNORES = new Set(['node_modules', '.git', 'donnees']);

const parcourir = async (dossier) => {
  const fichiers = [];
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    if (entree.name.startsWith('.') || DOSSIERS_IGNORES.has(entree.name)) continue;
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) fichiers.push(...(await parcourir(chemin)));
    else if (extname(entree.name) === '.js') fichiers.push(chemin);
  }
  return fichiers;
};

const fichiersEnErreur = [];
for (const chemin of await parcourir(process.cwd())) {
  try {
    await lancer(process.execPath, ['--check', chemin]);
  } catch (erreur) {
    fichiersEnErreur.push(`${chemin} : ${erreur.stderr.split('\n')[2] ?? 'syntaxe invalide'}`);
  }
}

if (fichiersEnErreur.length > 0) {
  console.error('Erreurs de syntaxe :');
  for (const ligne of fichiersEnErreur) console.error(` - ${ligne}`);
  process.exit(1);
}
console.log('Syntaxe valide pour tous les fichiers JavaScript.');
