// Chemins partages du projet.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const dossierRacine = join(dirname(fileURLToPath(import.meta.url)), '..');
export const dossierPublic = join(dossierRacine, 'public');
