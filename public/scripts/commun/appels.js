// Appels au serveur, partages par la page de creation et la page invitee.
// Le navigateur ne detient aucun secret : tout est verifie cote serveur.
export const appeler = async (chemin, options = {}) => {
  const reponse = await fetch(chemin, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    const erreur = new Error(donnees.erreur ?? 'Erreur inattendue.');
    erreur.statut = reponse.status;
    throw erreur;
  }
  return donnees;
};

export const envoyer = (chemin, corps, methode = 'POST') =>
  appeler(chemin, { method: methode, body: JSON.stringify(corps) });
