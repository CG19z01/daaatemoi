// Presentation d'un creneau dans une liste : date, heures, lieu, et les
// actions eventuelles (modifier, retirer).
import { enDateFrancaise } from '../dates.js';

const formateurDeJour = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'short',
});

const jourCourt = (dateIso) => {
  const instant = new Date(`${dateIso}T12:00:00Z`);
  return Number.isNaN(instant.getTime()) ? '' : formateurDeJour.format(instant);
};

export const libelleDUnCreneau = (creneau, nomDuLieu = null) =>
  [
    `${jourCourt(creneau.date)} ${enDateFrancaise(creneau.date)}`,
    `${creneau.heureDeDebut} – ${creneau.heureDeFin}`,
    nomDuLieu,
  ]
    .filter(Boolean)
    .join(' · ');

export const creerUneLigneDeCreneau = (creneau, nomDuLieu, actions = {}) => {
  const element = document.createElement('li');
  element.className = 'ligne-de-creneau';

  const texte = document.createElement('span');
  texte.textContent = libelleDUnCreneau(creneau, nomDuLieu);
  element.append(texte);

  const boutons = document.createElement('div');
  boutons.className = 'actions-du-creneau';
  for (const [intitule, action] of [
    ['Modifier', actions.auxModifications],
    ['Retirer', actions.auRetrait],
  ]) {
    if (!action) continue;
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'bouton bouton-contour action-du-creneau';
    bouton.textContent = intitule;
    bouton.addEventListener('click', action);
    boutons.append(bouton);
  }
  if (boutons.childElementCount > 0) element.append(boutons);
  return element;
};
