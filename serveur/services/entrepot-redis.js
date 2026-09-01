// Entrepot partage (Upstash Redis) : utilise des que le site tourne sur Vercel,
// ou les instances sont multiples et le disque en lecture seule.
import { Redis } from '@upstash/redis';

const adresse = () => process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const jeton = () => process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const redisEstConfigure = () => Boolean(adresse() && jeton());

let clientPartage = null;
const client = () => {
  if (!clientPartage) clientPartage = new Redis({ url: adresse(), token: jeton() });
  return clientPartage;
};

const analyser = (valeur) => {
  if (typeof valeur !== 'string') return valeur;
  try {
    return JSON.parse(valeur);
  } catch {
    return null;
  }
};

export const entrepotRedis = {
  ajouterDansCollection: async (nomDeLaCollection, element) => {
    await client().rpush(nomDeLaCollection, JSON.stringify(element));
    return element;
  },

  // Reecriture complete : suffisante pour les petites listes de ce site.
  remplacerLaCollection: async (nomDeLaCollection, elements) => {
    await client().del(nomDeLaCollection);
    if (elements.length > 0) {
      await client().rpush(nomDeLaCollection, ...elements.map((element) => JSON.stringify(element)));
    }
    return elements;
  },

  lireCollection: async (nomDeLaCollection) => {
    const elements = await client().lrange(nomDeLaCollection, 0, -1);
    return elements.map(analyser).filter(Boolean);
  },

  lireDocument: async (cle) => analyser(await client().get(cle)) ?? null,

  ecrireDocument: async (cle, valeur) => {
    await client().set(cle, JSON.stringify(valeur));
    return valeur;
  },

  // SET ... NX : l'ecriture n'a lieu que si la cle est libre. C'est l'operation
  // atomique qui garantit qu'un slug ne peut jamais etre attribue deux fois.
  creerDocumentSiAbsent: async (cle, valeur) => {
    const resultat = await client().set(cle, JSON.stringify(valeur), { nx: true });
    return resultat === 'OK';
  },

  // Parcours par curseur plutot que KEYS : Redis n'est jamais bloque.
  listerLesCles: async (prefixe) => {
    const cles = [];
    let curseur = '0';
    do {
      const [suivant, trouvees] = await client().scan(curseur, {
        match: `${prefixe}*`,
        count: 200,
      });
      cles.push(...trouvees);
      curseur = String(suivant);
    } while (curseur !== '0');
    return cles;
  },
};
