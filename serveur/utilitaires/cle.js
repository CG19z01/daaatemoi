// Transformation d'un texte libre en cle utilisable comme identifiant de
// stockage et dans une adresse : minuscules latines, chiffres et tirets.
export const enCle = (texte, longueurMaximale = 60) =>
  String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, longueurMaximale)
    .replace(/-+$/, '');
