// Catalogue complet des batiments : maisons et immeubles reunis.
// Ajouter un modele = ajouter une entree dans l'un des deux fichiers importes.
import { MODELES_DE_MAISONS } from './modeles-maisons.js';
import { MODELES_D_IMMEUBLES } from './modeles-immeubles.js';

export const CATALOGUE_DES_MODELES = [...MODELES_DE_MAISONS, ...MODELES_D_IMMEUBLES];

// Empreinte maximale d'un modele, utilisee pour dimensionner la grille de la ville.
export const EMPREINTE_MAXIMALE = 60;
