// Configuration centrale : toutes les valeurs sensibles viennent de l'environnement.

const lireVariable = (nom, valeurParDefaut = null) => {
  const valeur = process.env[nom];
  if (valeur === undefined || valeur === '') return valeurParDefaut;
  return valeur;
};

const variablesObligatoires = ['SECRET_SIGNATURE', 'ADMIN_IDENTIFIANT', 'ADMIN_MOT_DE_PASSE'];

export const verifierConfiguration = () => {
  const manquantes = variablesObligatoires.filter((nom) => !lireVariable(nom));
  if (manquantes.length > 0) {
    console.error(`Variables d'environnement manquantes : ${manquantes.join(', ')}`);
    console.error('Copiez .env.example vers .env puis renseignez les valeurs.');
    process.exit(1);
  }
};

// Adresse publique du site, utilisee pour composer le lien partage.
// Vercel renseigne VERCEL_PROJECT_PRODUCTION_URL : aucune adresse n'est ecrite
// en dur. A defaut, le serveur la deduit de l'en-tete Host de la requete.
const adressePubliqueConfiguree = () => {
  const explicite = lireVariable('SITE_ADRESSE_PUBLIQUE');
  if (explicite) return explicite.replace(/\/+$/, '');
  const surVercel = lireVariable('VERCEL_PROJECT_PRODUCTION_URL');
  return surVercel ? `https://${surVercel}` : '';
};

// Les services OpenStreetMap demandent une identification claire de l'appelant.
const AGENT_PAR_DEFAUT = 'daaatemoi/1.0 (site de proposition de rendez-vous)';
const SERVEURS_OVERPASS_PAR_DEFAUT = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
].join(',');

export const configuration = {
  port: Number(lireVariable('PORT', '3000')),
  secretDeSignature: lireVariable('SECRET_SIGNATURE', ''),
  adminIdentifiant: lireVariable('ADMIN_IDENTIFIANT', ''),
  adminMotDePasse: lireVariable('ADMIN_MOT_DE_PASSE', ''),
  enProduction: lireVariable('NODE_ENV') === 'production',
  adressePublique: adressePubliqueConfiguree(),
  // Notifications : absentes, le site fonctionne normalement, sans prevenir.
  sujetDeNotification: lireVariable('NTFY_SUJET', ''),
  serveurDeNotification: lireVariable('NTFY_ADRESSE', 'https://ntfy.sh'),
  // Facultatif : seules les instances privees demandent un jeton.
  jetonDeNotification: lireVariable('NTFY_JETON', ''),
  // Cartographie OpenStreetMap : aucun compte ni cle, seulement de la courtoisie.
  agentOsm: lireVariable('OSM_AGENT', AGENT_PAR_DEFAUT),
  serveurDeGeocodage: lireVariable('NOMINATIM_ADRESSE', 'https://nominatim.openstreetmap.org'),
  serveursOverpass: lireVariable('OVERPASS_ADRESSES', SERVEURS_OVERPASS_PAR_DEFAUT)
    .split(',')
    .map((adresse) => adresse.trim())
    .filter(Boolean),
};
