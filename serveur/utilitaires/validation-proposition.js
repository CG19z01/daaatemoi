// Validation d'une proposition de lieu libre : rien de ce qui vient du navigateur
// n'est repris tel quel. Les messages restent comprehensibles par le visiteur.
import { nettoyerTexte } from './validation.js';
import { dateDuJourAParis } from './date-paris.js';

const EXPRESSION_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EXPRESSION_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const LONGUEUR_MAXIMALE_DU_LIEU = 80;
const LONGUEUR_MINIMALE_DU_LIEU = 2;
// Le point place doit rester dans les environs de Rouen, sinon le cadrage
// de la carte serait bouleverse par une coordonnee fantaisiste.
const CENTRE_DE_ROUEN = { latitude: 49.4375, longitude: 1.0985 };
const ECART_MAXIMAL = { latitude: 0.06, longitude: 0.09 };

const COULEUR_VALIDE = /^#[0-9a-f]{6}$/i;
const COULEUR_PAR_DEFAUT = '#a30dad';

const estUnNombre = (valeur) => typeof valeur === 'number' && Number.isFinite(valeur);

// Renvoie { position } ou { erreur }. Une proposition sans point reste valable.
const validerLePoint = (corpsRecu) => {
  const { latitude, longitude } = corpsRecu ?? {};
  if (latitude === undefined && longitude === undefined) return { position: null };
  if (!estUnNombre(latitude) || !estUnNombre(longitude)) {
    return { erreur: 'Le point placé est invalide.' };
  }
  if (
    Math.abs(latitude - CENTRE_DE_ROUEN.latitude) > ECART_MAXIMAL.latitude ||
    Math.abs(longitude - CENTRE_DE_ROUEN.longitude) > ECART_MAXIMAL.longitude
  ) {
    return { erreur: 'Ce point est trop loin de Rouen.' };
  }
  return { position: { latitude, longitude } };
};

export const validerProposition = (corpsRecu) => {
  const lieuPropose = nettoyerTexte(corpsRecu?.lieuPropose, LONGUEUR_MAXIMALE_DU_LIEU);
  const dateProposee = nettoyerTexte(corpsRecu?.dateProposee, 10);
  const heureProposee = nettoyerTexte(corpsRecu?.heureProposee, 5);

  if (lieuPropose.length < LONGUEUR_MINIMALE_DU_LIEU) {
    return { erreur: 'Veuillez indiquer un lieu.' };
  }
  if (!dateProposee) return { erreur: 'Veuillez sélectionner une date.' };
  if (!EXPRESSION_DATE.test(dateProposee)) return { erreur: 'Veuillez indiquer une date valide.' };
  // Un 31 fevrier passe la forme mais glisse sur mars : on verifie l'aller-retour.
  const dateReelle = new Date(`${dateProposee}T12:00:00Z`);
  if (Number.isNaN(dateReelle.getTime()) || !dateReelle.toISOString().startsWith(dateProposee)) {
    return { erreur: 'Veuillez indiquer une date valide.' };
  }
  if (dateProposee < dateDuJourAParis()) return { erreur: 'Cette date est déjà passée.' };
  if (!heureProposee) return { erreur: 'Veuillez sélectionner une heure.' };
  if (!EXPRESSION_HEURE.test(heureProposee)) return { erreur: 'Veuillez indiquer une heure valide.' };

  const { erreur: erreurDuPoint, position } = validerLePoint(corpsRecu);
  if (erreurDuPoint) return { erreur: erreurDuPoint };

  // Une couleur incorrecte n'est pas une erreur : on retombe sur celle par defaut.
  const couleurRecue = corpsRecu?.couleur;
  const couleur = COULEUR_VALIDE.test(couleurRecue) ? couleurRecue : COULEUR_PAR_DEFAUT;

  return { proposition: { lieuPropose, dateProposee, heureProposee, position, couleur } };
};
