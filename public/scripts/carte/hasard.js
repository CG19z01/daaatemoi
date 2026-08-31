// Tirages aleatoires reproductibles : la ville est toujours dessinee a l'identique.
export const creerAleatoire = (graine) => {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
};

export const entre = (aleatoire, minimum, maximum) => minimum + aleatoire() * (maximum - minimum);

export const entier = (aleatoire, minimum, maximum) =>
  Math.floor(entre(aleatoire, minimum, maximum + 1));
