// Verifie la regle du CLAUDE.md : aucun fichier source ne depasse 150 lignes.
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const LIMITE_DE_LIGNES = 150;
const EXTENSIONS_SURVEILLEES = new Set(['.js', '.css', '.html']);
const DOSSIERS_IGNORES = new Set(['node_modules', '.git', 'donnees']);

const parcourir = async (dossier) => {
  const fichiers = [];
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    if (entree.name.startsWith('.') || DOSSIERS_IGNORES.has(entree.name)) continue;
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) fichiers.push(...(await parcourir(chemin)));
    else if (EXTENSIONS_SURVEILLEES.has(extname(entree.name))) fichiers.push(chemin);
  }
  return fichiers;
};

const fichiersTropLongs = [];
for (const chemin of await parcourir(process.cwd())) {
  const nombreDeLignes = (await readFile(chemin, 'utf8')).split('\n').length;
  if (nombreDeLignes > LIMITE_DE_LIGNES) fichiersTropLongs.push(`${chemin} : ${nombreDeLignes} lignes`);
}

if (fichiersTropLongs.length > 0) {
  console.error(`Fichiers depassant ${LIMITE_DE_LIGNES} lignes :`);
  for (const ligne of fichiersTropLongs) console.error(` - ${ligne}`);
  process.exit(1);
}
console.log(`Tous les fichiers respectent la limite de ${LIMITE_DE_LIGNES} lignes.`);
