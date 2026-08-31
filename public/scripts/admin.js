// Page d'administration : tout est verifie cote serveur, le navigateur n'affiche que le resultat.
import { enDateFrancaise } from './dates.js';
import { afficherLesPointsProposes } from './admin-points.js';
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

const remplirLeTableau = (corps, lignes, colonnes, messageSiVide) => {
  corps.replaceChildren();
  if (lignes.length === 0) {
    const ligne = corps.insertRow();
    const cellule = ligne.insertCell();
    cellule.colSpan = colonnes.length;
    cellule.textContent = messageSiVide;
    return;
  }
  for (const donnee of lignes) {
    const ligne = corps.insertRow();
    for (const colonne of colonnes) ligne.insertCell().textContent = donnee[colonne] ?? '—';
  }
};


// Retrait d'un point de la carte, apres confirmation.
const retirerUnPoint = async (lieu) => {
  if (!window.confirm(`Retirer « ${lieu.nom} » de la carte ?`)) return;
  await appeler(`/admin/api/lieux-proposes/${encodeURIComponent(lieu.identifiant)}`, {
    method: 'DELETE',
  });
  await chargerLesDonnees();
};

// Le nombre de traits est annonce avant tout effacement.
let nombreDeTraits = 0;

const effacerLeColoriage = async () => {
  if (!window.confirm(`Effacer les ${nombreDeTraits} trait(s) du coloriage ? C’est définitif.`)) {
    return;
  }
  await appeler('/admin/api/dessin', { method: 'DELETE' });
  await chargerLesDonnees();
};

const chargerLesDonnees = async () => {
  const [journal, reservations, points, dessin] = await Promise.all([
    appeler('/admin/api/journal'),
    appeler('/admin/api/reservations'),
    appeler('/admin/api/lieux-proposes'),
    appeler('/admin/api/dessin'),
  ]);
  nombreDeTraits = dessin.nombreDeTraits;
  document.getElementById('resumeDuColoriage').textContent =
    nombreDeTraits === 0 ? 'Aucun trait enregistré.' : `${nombreDeTraits} trait(s) enregistré(s).`;
  document.getElementById('boutonEffacerLeColoriage').disabled = nombreDeTraits === 0;
  afficherLesPointsProposes(points.lieuxProposes, retirerUnPoint);
  const interactions = journal.journalDesClics.map((ligne) => ({
    ...ligne,
    libelleDuType: ligne.type === 'autre_endroit' ? 'Autre endroit' : 'Clic',
    creneauPropose: ligne.dateProposee
      ? `${enDateFrancaise(ligne.dateProposee)} à ${ligne.heureProposee}`
      : '—',
  }));
  remplirLeTableau(
    document.getElementById('corpsDuJournal'),
    interactions,
    ['libelleDuType', 'nomDuLieu', 'creneauPropose', 'horodatage'],
    'Aucune interaction enregistrée pour le moment.',
  );
  const rendezVous = reservations.reservations.map((reservation) => ({
    ...reservation,
    dateDuRendezVous: enDateFrancaise(reservation.dateDeReservation),
  }));
  remplirLeTableau(
    document.getElementById('corpsDesReservations'),
    rendezVous,
    ['nomDuLieu', 'dateDuRendezVous', 'heureDeReservation', 'horodatageDeCreation'],
    'Aucune réservation pour le moment.',
  );
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

document.getElementById('boutonEffacerLeColoriage').addEventListener('click', effacerLeColoriage);

document.getElementById('boutonDeconnexion').addEventListener('click', async () => {
  await appeler('/admin/api/deconnexion', { method: 'POST' });
  await afficherSelonLAuthentification();
});


afficherSelonLAuthentification().catch(() => {
  blocConnexion.hidden = false;
});
