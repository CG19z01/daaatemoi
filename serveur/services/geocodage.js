// Recherche d'une ville via Nominatim (OpenStreetMap) : ni compte, ni cle API,
// donc aucun secret a proteger cote navigateur. En contrepartie, l'appelant doit
// s'identifier et rester sous une requete par seconde : les deux sont respectes
// ici, et le resultat est mis en cache par le service qui appelle.
import { configuration } from '../config.js';

const DELAI_MAXIMAL_EN_MILLISECONDES = 9000;
const INTERVALLE_MINIMAL_EN_MILLISECONDES = 1100;

let derniereRequete = 0;

const attendre = (duree) => new Promise((terminer) => setTimeout(terminer, duree));

// Respecte l'intervalle demande par la politique d'usage de Nominatim.
const patienterSiNecessaire = async () => {
  const attente = derniereRequete + INTERVALLE_MINIMAL_EN_MILLISECONDES - Date.now();
  if (attente > 0) await attendre(attente);
  derniereRequete = Date.now();
};

const composerLAdresse = (nomDeLaVille) => {
  const adresse = new URL('/search', configuration.serveurDeGeocodage);
  adresse.searchParams.set('q', nomDeLaVille);
  adresse.searchParams.set('format', 'jsonv2');
  adresse.searchParams.set('limit', '1');
  adresse.searchParams.set('addressdetails', '1');
  adresse.searchParams.set('accept-language', 'fr');
  // Seules les localites sont acceptees : une ville, pas une rue ni un magasin.
  adresse.searchParams.set('featureType', 'settlement');
  return adresse;
};

// Nominatim rend la boite englobante sous la forme [sud, nord, ouest, est].
const lireLaBoiteEnglobante = (boite) => {
  if (!Array.isArray(boite) || boite.length !== 4) return null;
  const [sud, nord, ouest, est] = boite.map(Number);
  if (![sud, nord, ouest, est].every(Number.isFinite)) return null;
  if (nord <= sud || est <= ouest) return null;
  return { sud, nord, ouest, est };
};

// Renvoie { nom, pays, latitude, longitude, boiteEnglobante } ou null.
export const geocoderUneVille = async (nomDeLaVille) => {
  await patienterSiNecessaire();
  const reponse = await fetch(composerLAdresse(nomDeLaVille), {
    headers: { 'User-Agent': configuration.agentOsm, Accept: 'application/json' },
    signal: AbortSignal.timeout(DELAI_MAXIMAL_EN_MILLISECONDES),
  });
  if (!reponse.ok) throw new Error(`geocodage indisponible (${reponse.status})`);

  const resultats = await reponse.json();
  const premier = Array.isArray(resultats) ? resultats[0] : null;
  if (!premier) return null;

  const latitude = Number(premier.lat);
  const longitude = Number(premier.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    nom: String(premier.name ?? nomDeLaVille).slice(0, 80),
    pays: String(premier.address?.country ?? '').slice(0, 80),
    latitude,
    longitude,
    boiteEnglobante: lireLaBoiteEnglobante(premier.boundingbox),
  };
};
