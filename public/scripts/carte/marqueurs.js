// Marqueurs interactifs : un bouton accessible par checkpoint, place par la projection.
// Seuls les lieux dont les coordonnees sont renseignees recoivent un marqueur.
import { aDesCoordonnees } from './projection.js';

const DUREE_DE_L_APPEL_DU_REGARD = 5000;

export const creerLesMarqueurs = (couche, listeDesLieux, auClicSurUnLieu) => {
  const marqueurs = listeDesLieux.filter(aDesCoordonnees).map((lieu) => {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'marqueur attire-l-oeil';
    bouton.setAttribute('aria-label', `${lieu.nom} : ${lieu.activite}`);

    const epingle = document.createElement('span');
    epingle.className = 'epingle';

    const etiquette = document.createElement('span');
    etiquette.className = 'etiquette';
    etiquette.textContent = lieu.nom;

    bouton.append(epingle, etiquette);
    bouton.addEventListener('click', () => auClicSurUnLieu(lieu));
    couche.append(bouton);
    return { lieu, bouton };
  });

  // L'appel du regard ne se declenche qu'une fois, a l'arrivee sur la carte.
  setTimeout(() => {
    for (const marqueur of marqueurs) marqueur.bouton.classList.remove('attire-l-oeil');
  }, DUREE_DE_L_APPEL_DU_REGARD);

  const repositionner = (projection) => {
    for (const marqueur of marqueurs) {
      // Recalculee a chaque fois : l'orientation du monde peut avoir change.
      const position = projection.versEcran(marqueur.lieu);
      marqueur.bouton.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -100%)`;
    }
  };

  const selectionner = (identifiantDuLieu) => {
    for (const marqueur of marqueurs) {
      marqueur.bouton.classList.toggle(
        'est-selectionne',
        marqueur.lieu.identifiant === identifiantDuLieu,
      );
    }
  };

  return { repositionner, selectionner };
};
