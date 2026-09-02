// Nettoyage des textes venus du navigateur : rien de ce qui en vient n'est fiable.
const CARACTERES_INTERDITS = /[\x00-\x1f<>]/g;

export const nettoyerTexte = (valeur, longueurMaximale = 80) => {
  if (typeof valeur !== 'string') return '';
  return valeur.replace(CARACTERES_INTERDITS, '').trim().slice(0, longueurMaximale);
};
