// Express 4 n'attrape pas les rejets des gestionnaires asynchrones :
// ce petit emballage renvoie l'erreur au gestionnaire d'erreurs de l'application.
export const attraper = (gestionnaire) => (requete, reponse, suite) =>
  Promise.resolve(gestionnaire(requete, reponse, suite)).catch(suite);
