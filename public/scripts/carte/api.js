// Appels au serveur. Aucune donnee de lieu n'est stockee en dur cote navigateur.
const appeler = async (chemin, options = {}) => {
  const reponse = await fetch(chemin, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(donnees.erreur ?? 'Erreur inattendue.');
  return donnees;
};

// Renvoie la liste choisie et les points proposes par les visiteurs.
export const recupererLesLieux = async () => {
  const { listeDesLieux, lieuxProposes } = await appeler('/api/lieux');
  return { listeDesLieux: listeDesLieux ?? [], lieuxProposes: lieuxProposes ?? [] };
};

export const journaliserLeClic = (identifiantDuLieu) =>
  appeler('/api/journal', { method: 'POST', body: JSON.stringify({ identifiantDuLieu }) });

export const envoyerLaReservation = (demande) =>
  appeler('/api/reservations', { method: 'POST', body: JSON.stringify(demande) });

export const envoyerUneProposition = (proposition) =>
  appeler('/api/autre-endroit', { method: 'POST', body: JSON.stringify(proposition) });

export const recupererLeDessin = async () => (await appeler('/api/dessin')).traits ?? [];

export const envoyerUnTrait = (trait) =>
  appeler('/api/dessin', { method: 'POST', body: JSON.stringify(trait) });
