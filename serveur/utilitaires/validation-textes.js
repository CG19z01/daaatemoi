// Validation des zones de texte posées sur la carte. Comme pour les traits,
// rien de ce qui vient du navigateur n'est stocké sans vérification de forme
// et de bornes.
//
// La position est en mètres relatifs au centre de la ville, jamais en pixels :
// le texte reste au bon endroit sur n'importe quel écran.
const COULEUR_VALIDE = /^#[0-9a-f]{6}$/i;
const CARACTERES_INTERDITS = /[\x00-\x1f<>]/g;

export const TEXTES_MAXIMAUX = 20;
const LONGUEUR_MAXIMALE = 120;
const PORTEE_MAXIMALE_EN_METRES = 8000;
export const TAILLE_MINIMALE = 10;
export const TAILLE_MAXIMALE = 64;
export const COULEUR_PAR_DEFAUT = '#000000';
export const TAILLE_PAR_DEFAUT = 20;

const estUnNombre = (valeur) => typeof valeur === 'number' && Number.isFinite(valeur);

// Renvoie { texte } ou { erreur }.
export const validerUnTexte = (texteRecu) => {
  const contenu =
    typeof texteRecu?.contenu === 'string'
      ? texteRecu.contenu.replace(CARACTERES_INTERDITS, '').trim().slice(0, LONGUEUR_MAXIMALE)
      : '';
  if (contenu.length === 0) return { erreur: 'Texte vide.' };

  const { x, y } = texteRecu?.point ?? {};
  if (!estUnNombre(x) || !estUnNombre(y)) return { erreur: 'Texte mal placé.' };
  if (Math.abs(x) > PORTEE_MAXIMALE_EN_METRES || Math.abs(y) > PORTEE_MAXIMALE_EN_METRES) {
    return { erreur: 'Texte placé trop loin du centre.' };
  }

  const taille = estUnNombre(texteRecu?.taille) ? texteRecu.taille : TAILLE_PAR_DEFAUT;
  return {
    texte: {
      contenu,
      point: { x: Math.round(x), y: Math.round(y) },
      couleur: COULEUR_VALIDE.test(texteRecu?.couleur) ? texteRecu.couleur : COULEUR_PAR_DEFAUT,
      taille: Math.round(Math.min(TAILLE_MAXIMALE, Math.max(TAILLE_MINIMALE, taille))),
    },
  };
};

// Renvoie { textes } ou { erreur }. La liste complète remplace la précédente :
// créer, déplacer, modifier et supprimer passent par le même chemin.
export const validerLesTextes = (textesRecus) => {
  if (textesRecus === undefined || textesRecus === null) return { textes: [] };
  if (!Array.isArray(textesRecus)) return { erreur: 'Liste de textes invalide.' };
  if (textesRecus.length > TEXTES_MAXIMAUX) {
    return { erreur: `Pas plus de ${TEXTES_MAXIMAUX} textes sur une carte.` };
  }
  const textes = [];
  for (const texteRecu of textesRecus) {
    const { erreur, texte } = validerUnTexte(texteRecu);
    if (erreur) return { erreur };
    textes.push(texte);
  }
  return { textes };
};
