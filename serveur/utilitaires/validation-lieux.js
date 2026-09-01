// Validation des lieux d'une experience. Le navigateur propose, le serveur
// dispose : nombre, longueurs et position sont tous verifies ici.
import { nettoyerTexte } from './validation.js';
import { nettoyerLesHoraires } from './validation-horaires.js';

export const LIEUX_MAXIMAUX_PAR_EXPERIENCE = 5;
const LONGUEUR_MINIMALE_DU_NOM = 2;
const LONGUEUR_MAXIMALE_DU_NOM = 80;
const LONGUEUR_MAXIMALE_DE_L_ADRESSE = 120;
const LONGUEUR_MAXIMALE_DE_LA_CATEGORIE = 40;
// Le fond de carte s'etend au plus a quatre kilometres du centre : un point
// place bien au-dela ne correspondrait a rien de visible.
const PORTEE_MAXIMALE_EN_METRES = 8000;

const estUnNombre = (valeur) => typeof valeur === 'number' && Number.isFinite(valeur);

// Le point est enregistre en metres relatifs au centre de la ville : il suit
// donc la carte, quelle que soit la taille de l'ecran qui l'affiche.
const validerLePoint = (pointRecu) => {
  const { x, y } = pointRecu ?? {};
  if (!estUnNombre(x) || !estUnNombre(y)) return { erreur: 'Ce lieu n’est pas placé sur la carte.' };
  if (Math.abs(x) > PORTEE_MAXIMALE_EN_METRES || Math.abs(y) > PORTEE_MAXIMALE_EN_METRES) {
    return { erreur: 'Ce point est trop loin du centre de la ville.' };
  }
  return { point: { x: Math.round(x), y: Math.round(y) } };
};

// Renvoie { lieu } ou { erreur }. L'identifiant est attribue par le serveur.
export const validerUnLieu = (lieuRecu, numero, ajoutePar) => {
  const nom = nettoyerTexte(lieuRecu?.nom, LONGUEUR_MAXIMALE_DU_NOM);
  if (nom.length < LONGUEUR_MINIMALE_DU_NOM) return { erreur: 'Chaque lieu a besoin d’un nom.' };

  const { erreur, point } = validerLePoint(lieuRecu?.point);
  if (erreur) return { erreur: `${nom} : ${erreur}` };

  return {
    lieu: {
      identifiant: `lieu-${numero}`,
      nom,
      adresse: nettoyerTexte(lieuRecu?.adresse, LONGUEUR_MAXIMALE_DE_L_ADRESSE),
      categorie: nettoyerTexte(lieuRecu?.categorie, LONGUEUR_MAXIMALE_DE_LA_CATEGORIE),
      reference: nettoyerTexte(lieuRecu?.reference, 60) || null,
      horaires: nettoyerLesHoraires(lieuRecu?.horaires),
      point,
      ajoutePar,
    },
  };
};

// Renvoie { lieux } ou { erreur }. La limite de cinq lieux est absolue.
export const validerLesLieux = (lieuxRecus, ajoutePar = 'createur', dejaPresents = 0) => {
  if (lieuxRecus === undefined || lieuxRecus === null) return { lieux: [] };
  if (!Array.isArray(lieuxRecus)) return { erreur: 'Liste de lieux invalide.' };
  if (dejaPresents + lieuxRecus.length > LIEUX_MAXIMAUX_PAR_EXPERIENCE) {
    return { erreur: `Une expérience ne peut pas dépasser ${LIEUX_MAXIMAUX_PAR_EXPERIENCE} lieux.` };
  }

  const lieux = [];
  for (const lieuRecu of lieuxRecus) {
    const { erreur, lieu } = validerUnLieu(lieuRecu, dejaPresents + lieux.length + 1, ajoutePar);
    if (erreur) return { erreur };
    lieux.push(lieu);
  }
  return { lieux };
};
