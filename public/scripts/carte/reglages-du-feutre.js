// Réglages communs des outils de tracé : les modes et les bornes du trait.
// Ils vivent à part pour que la coloration ne porte que sa mécanique.
export const COULEUR_PAR_DEFAUT = '#a30dad';
export const TAILLE_MINIMALE = 6;
export const TAILLE_MAXIMALE = 78;
export const TAILLE_PAR_DEFAUT = 30;
export const PAS_DE_TAILLE = 8;

export const MODE_FEUTRE = 'feutre';
export const MODE_GOMME = 'gomme';
// Le remplissage ne trace rien : il ne retient que le point visé et la couleur.
// La zone est recalculée à l'affichage par la fonction fournie à la scène.
export const MODE_REMPLISSAGE = 'remplissage';
