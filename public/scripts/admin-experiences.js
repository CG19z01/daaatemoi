// Experiences creees depuis la page de creation, affichees dans l'administration.
// Aucune donnee secrete n'arrive ici : le serveur n'envoie qu'un resume.
import { libelleDUnCreneau } from './commun/creneau-affiche.js';

const decrire = (creneau) => (creneau ? libelleDUnCreneau(creneau, creneau.nomDuLieu) : '—');

const cellule = (ligne, texte) => {
  ligne.insertCell().textContent = texte;
};

export const afficherLesExperiences = (experiences) => {
  const corps = document.getElementById('corpsDesExperiences');
  corps.replaceChildren();

  if (experiences.length === 0) {
    const ligne = corps.insertRow();
    const vide = ligne.insertCell();
    vide.colSpan = 6;
    vide.textContent = 'Aucune expérience créée pour le moment.';
    return;
  }

  for (const experience of experiences) {
    const ligne = corps.insertRow();
    cellule(ligne, [experience.ville, experience.pays].filter(Boolean).join(', '));

    // Le lien est cliquable : il mene a la page invitee, protegee par mot de passe.
    const lien = document.createElement('a');
    lien.href = experience.lien;
    lien.textContent = experience.slug;
    lien.target = '_blank';
    lien.rel = 'noopener';
    ligne.insertCell().append(lien);

    cellule(ligne, experience.dateDeCreation ?? '—');
    cellule(ligne, `${experience.nombreDeLieux} lieu(x) · ${experience.nombreDeDisponibilites} date(s)`);
    cellule(ligne, decrire(experience.rendezVousChoisi));
    cellule(
      ligne,
      experience.propositions.length === 0
        ? '—'
        : experience.propositions.map((creneau) => decrire(creneau)).join(' | '),
    );
  }
};
