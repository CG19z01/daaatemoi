// Validation de la creation d'une experience. Tout est verifie ici, sans jamais
// faire confiance au navigateur : ni le slug (attribue par le serveur), ni les
// lieux, ni les horaires, ni les dates, ni les positions des points.
import { nettoyerTexte } from './validation.js';
import { validerLesLieux } from './validation-lieux.js';
import { validerUnCreneau } from './validation-creneau.js';
import { enCle } from './cle.js';
import {
  LONGUEUR_MINIMALE_DU_MOT_DE_PASSE,
  LONGUEUR_MAXIMALE_DU_MOT_DE_PASSE,
} from './mot-de-passe.js';

export const DISPONIBILITES_MAXIMALES = 12;

const validerLeMotDePasse = (corpsRecu) => {
  const motDePasse = typeof corpsRecu?.motDePasse === 'string' ? corpsRecu.motDePasse : '';
  const confirmation =
    typeof corpsRecu?.confirmationDuMotDePasse === 'string'
      ? corpsRecu.confirmationDuMotDePasse
      : '';
  if (motDePasse.length < LONGUEUR_MINIMALE_DU_MOT_DE_PASSE) {
    return { erreur: `Le mot de passe fait au moins ${LONGUEUR_MINIMALE_DU_MOT_DE_PASSE} caractères.` };
  }
  if (motDePasse.length > LONGUEUR_MAXIMALE_DU_MOT_DE_PASSE) {
    return { erreur: 'Ce mot de passe est trop long.' };
  }
  // La correspondance est aussi verifiee cote serveur, pas seulement a l'ecran.
  if (motDePasse !== confirmation) {
    return { erreur: 'Les deux mots de passe ne correspondent pas.' };
  }
  return { motDePasse };
};

// A la creation, les lieux n'ont pas encore d'identifiant cote navigateur :
// une disponibilite designe donc son lieu par son rang dans la liste envoyee.
const rattacherLeLieu = (creneauRecu, lieux) => {
  const rang = Number(creneauRecu?.indexDuLieu);
  const lieu = Number.isInteger(rang) && rang >= 0 && rang < lieux.length ? lieux[rang] : null;
  return { ...creneauRecu, identifiantDuLieu: lieu?.identifiant ?? null };
};

const validerLesDisponibilites = (disponibilitesRecues, lieux) => {
  if (disponibilitesRecues === undefined || disponibilitesRecues === null) {
    return { disponibilites: [] };
  }
  if (!Array.isArray(disponibilitesRecues)) return { erreur: 'Disponibilités invalides.' };
  if (disponibilitesRecues.length > DISPONIBILITES_MAXIMALES) {
    return { erreur: `Pas plus de ${DISPONIBILITES_MAXIMALES} disponibilités.` };
  }
  const disponibilites = [];
  for (const creneauRecu of disponibilitesRecues) {
    const { erreur, creneau } = validerUnCreneau(rattacherLeLieu(creneauRecu, lieux), lieux);
    if (erreur) return { erreur };
    disponibilites.push(creneau);
  }
  return { disponibilites };
};

// Renvoie { experience } (sans slug ni empreinte : le service s'en charge)
// ou { erreur }.
export const validerUneExperience = (corpsRecu) => {
  const villeCle = enCle(nettoyerTexte(corpsRecu?.villeCle, 60));
  if (!villeCle) return { erreur: 'Veuillez choisir une ville.' };

  const { erreur: erreurDesLieux, lieux } = validerLesLieux(corpsRecu?.lieux, 'createur');
  if (erreurDesLieux) return { erreur: erreurDesLieux };

  const { erreur: erreurDesDates, disponibilites } = validerLesDisponibilites(
    corpsRecu?.disponibilites,
    lieux,
  );
  if (erreurDesDates) return { erreur: erreurDesDates };

  const { erreur: erreurDuMotDePasse, motDePasse } = validerLeMotDePasse(corpsRecu);
  if (erreurDuMotDePasse) return { erreur: erreurDuMotDePasse };

  return { experience: { villeCle, lieux, disponibilites }, motDePasse };
};
