// Enregistrement différé : plusieurs modifications rapprochées ne déclenchent
// qu'un seul envoi, une fois le geste terminé. Évite d'appeler le serveur à
// chaque déplacement.
const DELAI_PAR_DEFAUT = 800;

export const creerEnregistrementDiffere = (enregistrer, delai = DELAI_PAR_DEFAUT) => {
  let attente = null;
  return () => {
    clearTimeout(attente);
    attente = setTimeout(() => {
      Promise.resolve(enregistrer()).catch(() => {
        // L'appelant affiche l'échec : ici, on ne fait surtout pas tomber la page.
      });
    }, delai);
  };
};
