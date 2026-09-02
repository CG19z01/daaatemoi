// Chaque page est chargee dans un DOM simule : un module qui explose au
// demarrage laisse la page inerte, et l'on ne s'en apercoit qu'a l'usage.
// C'est ce qui rend un formulaire muet, donc soumis en clair par le navigateur.
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { installerLeDomSimule } from './dom-simule.js';

const dossierPublic = join(process.cwd(), 'public');
const PAGES = ['creation.html', 'invite.html', 'admin.html', 'index.html'];

// Les scripts de module declares par une page, dans l'ordre du balisage.
const scriptsDeLaPage = async (page) => {
  const balisage = await readFile(join(dossierPublic, page), 'utf8');
  return [...balisage.matchAll(/<script[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g)]
    .map((trouvaille) => trouvaille[1]);
};

let echecs = 0;

for (const page of PAGES) {
  for (const script of await scriptsDeLaPage(page)) {
    installerLeDomSimule();
    const chemin = resolve(dossierPublic, script.replace(/^\//, ''));
    const rejets = [];
    const noterLeRejet = (raison) => rejets.push(raison);
    process.on('unhandledRejection', noterLeRejet);
    try {
      await import(`${chemin}?page=${encodeURIComponent(page)}`);
      // Les erreurs des fonctions asynchrones n'arrivent qu'au tour suivant.
      await new Promise((suite) => setImmediate(suite));
      if (rejets.length > 0) throw rejets[0];
      console.log(`  ok   ${page} : ${script} se charge`);
    } catch (erreur) {
      echecs += 1;
      console.error(`  ECHEC ${page} : ${script} — ${erreur?.message ?? erreur}`);
      const pile = String(erreur?.stack ?? '').split('\n').slice(1, 4).join('\n');
      if (pile) console.error(pile);
    } finally {
      process.off('unhandledRejection', noterLeRejet);
    }
  }
}

if (echecs > 0) {
  console.error(`\n${echecs} page(s) ne se chargent pas.`);
  process.exit(1);
}
console.log('Toutes les pages se chargent sans erreur.');
