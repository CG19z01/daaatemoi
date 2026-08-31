// Choix de l'entrepot : partage des qu'il est configure, local sinon.
import { entrepotRedis, redisEstConfigure } from './entrepot-redis.js';
import { entrepotLocal } from './entrepot-local.js';

export const entrepotEstPartage = redisEstConfigure();

export const entrepot = entrepotEstPartage ? entrepotRedis : entrepotLocal;

console.log(
  entrepotEstPartage
    ? 'Stockage partage (Redis) : journal et reservations valables sur toutes les instances.'
    : 'Stockage local (fichiers JSON) : suffisant en developpement, pas pour un deploiement.',
);
