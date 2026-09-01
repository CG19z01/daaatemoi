// Verifie que chaque identifiant demande par les scripts d'une page existe bien
// dans son balisage. Le projet decoupe beaucoup de fichiers : ce controle evite
// qu'un module cherche un element absent de la page qui le charge.
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

// Fragments inseres au chargement : leurs identifiants comptent aussi.
const PAGES = [
  { page: 'public/index.html', fragments: [] },
  { page: 'public/introuvable.html', fragments: [] },
  { page: 'public/admin.html', fragments: [] },
  { page: 'public/creation.html', fragments: ['public/fragments/fenetres-communes.html'] },
  { page: 'public/invite.html', fragments: ['public/fragments/fenetres-communes.html'] },
];

const lire = (chemin) => readFile(resolve(process.cwd(), chemin), 'utf8');

const identifiantsDuBalisage = (balisage) =>
  new Set([...balisage.matchAll(/id="([^"]+)"/g)].map((trouvaille) => trouvaille[1]));

const scriptsDeLaPage = (balisage) =>
  [...balisage.matchAll(/<script[^>]+src="(\/scripts\/[^"]+)"/g)].map((trouvaille) =>
    join('public', trouvaille[1]),
  );

// Parcours des imports relatifs, pour reunir tous les modules d'une page.
const modulesAtteignables = async (departs) => {
  const aVisiter = [...departs];
  const visites = new Set();
  while (aVisiter.length > 0) {
    const chemin = aVisiter.pop();
    if (visites.has(chemin)) continue;
    visites.add(chemin);
    const source = await lire(chemin);
    for (const trouvaille of source.matchAll(/from\s+'(\.[^']+)'/g)) {
      aVisiter.push(join(dirname(chemin), trouvaille[1]));
    }
  }
  return [...visites];
};

const identifiantsDemandes = async (modules) => {
  const demandes = new Map();
  for (const chemin of modules) {
    const source = await lire(chemin);
    for (const trouvaille of source.matchAll(/getElementById\('([^']+)'\)/g)) {
      if (!demandes.has(trouvaille[1])) demandes.set(trouvaille[1], chemin);
    }
  }
  return demandes;
};

const manquants = [];

for (const { page, fragments } of PAGES) {
  const balisage = await lire(page);
  const identifiants = identifiantsDuBalisage(balisage);
  for (const fragment of fragments) {
    for (const identifiant of identifiantsDuBalisage(await lire(fragment))) {
      identifiants.add(identifiant);
    }
  }

  const modules = await modulesAtteignables(scriptsDeLaPage(balisage));
  for (const [identifiant, module] of await identifiantsDemandes(modules)) {
    if (identifiants.has(identifiant)) continue;
    manquants.push(`${page} : « ${identifiant} » demandé par ${relative(process.cwd(), module)}`);
  }
}

if (manquants.length > 0) {
  console.error('Identifiants introuvables dans le balisage :');
  for (const ligne of manquants) console.error(` - ${ligne}`);
  process.exit(1);
}
console.log('Chaque page contient les identifiants demandés par ses scripts.');
