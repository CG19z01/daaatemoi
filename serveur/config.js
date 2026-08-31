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

export const configuration = {
  port: Number(lireVariable('PORT', '3000')),
  secretDeSignature: lireVariable('SECRET_SIGNATURE', ''),
  adminIdentifiant: lireVariable('ADMIN_IDENTIFIANT', ''),
  adminMotDePasse: lireVariable('ADMIN_MOT_DE_PASSE', ''),
  enProduction: lireVariable('NODE_ENV') === 'production',
  // Notifications : absentes, le site fonctionne normalement, sans prevenir.
  sujetDeNotification: lireVariable('NTFY_SUJET', ''),
  serveurDeNotification: lireVariable('NTFY_ADRESSE', 'https://ntfy.sh'),
  // Facultatif : seules les instances privees demandent un jeton.
  jetonDeNotification: lireVariable('NTFY_JETON', ''),
};
