// Dates proposees par le createur : l'invite en retient une, ou aucune s'il
// prefere proposer les siennes.
import { etat, surChangement, choisirLaDisponibilite, nomDuLieu } from './etat.js';
import { libelleDUnCreneau } from '../commun/creneau-affiche.js';

export const brancherLesDisponibilites = () => {
  const liste = document.getElementById('listeDesDisponibilites');
  const indication = document.getElementById('aucuneDisponibilite');

  const creerUneLigne = (creneau, rang) => {
    const element = document.createElement('li');
    element.className = etat.rangChoisi === rang ? 'ligne-de-creneau est-choisie' : 'ligne-de-creneau';

    const texte = document.createElement('span');
    texte.textContent = libelleDUnCreneau(creneau, nomDuLieu(creneau.identifiantDuLieu));

    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'bouton bouton-contour action-du-creneau';
    bouton.textContent = etat.rangChoisi === rang ? 'Choisie ✓' : 'Choisir';
    bouton.setAttribute('aria-pressed', String(etat.rangChoisi === rang));
    bouton.addEventListener('click', () => choisirLaDisponibilite(rang));

    const actions = document.createElement('div');
    actions.className = 'actions-du-creneau';
    actions.append(bouton);
    element.append(texte, actions);
    return element;
  };

  const rafraichir = () => {
    const disponibilites = etat.experience?.disponibilites ?? [];
    liste.replaceChildren(...disponibilites.map(creerUneLigne));
    indication.hidden = disponibilites.length > 0;
  };

  surChangement(rafraichir);
};
