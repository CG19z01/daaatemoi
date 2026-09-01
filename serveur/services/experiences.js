// Cycle de vie d'une experience : creation, lecture et enregistrement de la
// reponse de l'invite. Le document complet ne quitte jamais cette couche sans
// passer par sansSecret() : l'empreinte du mot de passe reste au serveur.
import { entrepot } from './entrepot.js';
import { composerUnSlug, SLUG_VALIDE } from './slug.js';
import { hacherLeMotDePasse } from '../utilitaires/mot-de-passe.js';
import { formaterHorodatage } from '../utilitaires/date-paris.js';

export const PREFIXE_DES_EXPERIENCES = 'experience-';
const TENTATIVES_DE_SLUG = 20;

const cleDeLExperience = (slug) => `${PREFIXE_DES_EXPERIENCES}${slug}`;

export const recupererUneExperience = async (slug) => {
  if (typeof slug !== 'string' || !SLUG_VALIDE.test(slug)) return null;
  return entrepot.lireDocument(cleDeLExperience(slug));
};

// Vue envoyee au navigateur : tout sauf l'empreinte du mot de passe.
export const sansSecret = (experience) => {
  if (!experience) return null;
  const { empreinteDuMotDePasse, ...visible } = experience;
  return visible;
};

// Le slug est tire au sort par le serveur, puis reserve par une ecriture
// exclusive (SET NX sur Redis, ouverture en mode wx sur disque). C'est le
// stockage lui-meme qui garantit l'unicite : deux creations simultanees ne
// peuvent pas obtenir la meme adresse, et une experience existante n'est
// jamais ecrasee, meme si le meme tirage revenait.
export const creerUneExperience = async ({ lieux, disponibilites }, ville, motDePasse) => {
  const instant = new Date();
  const base = {
    ville,
    lieux,
    disponibilites,
    empreinteDuMotDePasse: await hacherLeMotDePasse(motDePasse),
    dateDeCreation: formaterHorodatage(instant),
    instantDeCreation: instant.toISOString(),
    reponse: null,
  };

  for (let tentative = 0; tentative < TENTATIVES_DE_SLUG; tentative += 1) {
    const slug = composerUnSlug();
    const experience = { slug, ...base };
    if (await entrepot.creerDocumentSiAbsent(cleDeLExperience(slug), experience)) {
      return experience;
    }
  }
  throw new Error('Aucune adresse libre trouvee apres plusieurs essais.');
};

const enregistrer = async (experience) => {
  await entrepot.ecrireDocument(cleDeLExperience(experience.slug), experience);
  return experience;
};

// Reponse de l'invite : rendez-vous retenu et propositions alternatives.
export const enregistrerLaReponse = async (slug, reponse) => {
  const experience = await recupererUneExperience(slug);
  if (!experience) return null;
  return enregistrer({
    ...experience,
    reponse: { ...reponse, horodatage: formaterHorodatage(new Date()) },
  });
};

// Lieux ajoutes par l'invite : la limite globale est verifiee en amont.
export const ajouterDesLieux = async (slug, nouveauxLieux) => {
  const experience = await recupererUneExperience(slug);
  if (!experience) return null;
  return enregistrer({ ...experience, lieux: [...experience.lieux, ...nouveauxLieux] });
};

// Correction d'un lieu deja enregistre (ses horaires, par exemple).
// Renvoie null si l'experience ou le lieu n'existe pas.
export const modifierUnLieu = async (slug, identifiant, modifications) => {
  const experience = await recupererUneExperience(slug);
  if (!experience) return null;
  if (!experience.lieux.some((lieu) => lieu.identifiant === identifiant)) return null;
  return enregistrer({
    ...experience,
    lieux: experience.lieux.map((lieu) =>
      lieu.identifiant === identifiant ? { ...lieu, ...modifications } : lieu,
    ),
  });
};

export const listerLesExperiences = async () => {
  const cles = await entrepot.listerLesCles(PREFIXE_DES_EXPERIENCES);
  const experiences = await Promise.all(cles.map((cle) => entrepot.lireDocument(cle)));
  return experiences
    .filter(Boolean)
    .sort((premiere, seconde) =>
      String(seconde.instantDeCreation).localeCompare(String(premiere.instantDeCreation)),
    );
};
