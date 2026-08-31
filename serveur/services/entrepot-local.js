// Entrepot de developpement : fichiers JSON sur le disque.
// Sert uniquement quand aucun stockage partage n'est configure.
import { ajouterDansCollection, lireCollection, remplacerLaCollection } from './stockage.js';

export const entrepotLocal = { ajouterDansCollection, lireCollection, remplacerLaCollection };
