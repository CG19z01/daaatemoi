// Page d'administration : tout est verifie cote serveur, le navigateur n'affiche que le resultat.
import { afficherLesExperiences } from './admin-experiences.js';
const blocConnexion = document.getElementById('blocConnexion');
const blocTableauDeBord = document.getElementById('blocTableauDeBord');
const messageConnexion = document.getElementById('messageConnexion');

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

const chargerLesDonnees = async () => {
  const { experiences } = await appeler('/admin/api/experiences');
  afficherLesExperiences(experiences ?? []);
};

const afficherSelonLAuthentification = async () => {
  const { authentifie } = await appeler('/admin/api/etat');
  blocConnexion.hidden = authentifie;
  blocTableauDeBord.hidden = !authentifie;
  if (authentifie) await chargerLesDonnees();
};

document.getElementById('formulaireConnexion').addEventListener('submit', async (evenement) => {
  evenement.preventDefault();
  messageConnexion.textContent = 'Vérification...';
  try {
    await appeler('/admin/api/connexion', {
      method: 'POST',
      body: JSON.stringify({
        identifiant: document.getElementById('champIdentifiant').value,
        motDePasse: document.getElementById('champMotDePasse').value,
      }),
    });
    messageConnexion.textContent = '';
    await afficherSelonLAuthentification();
  } catch (erreur) {
    messageConnexion.textContent = erreur.message;
  }
});

document.getElementById('boutonDeconnexion').addEventListener('click', async () => {
  await appeler('/admin/api/deconnexion', { method: 'POST' });
  await afficherSelonLAuthentification();
});


afficherSelonLAuthentification().catch(() => {
  blocConnexion.hidden = false;
});
