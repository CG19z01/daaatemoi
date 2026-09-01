// Reperes des lieux d'une experience. Leur position est retenue en metres
// bruts : elle suit la carte quel que soit l'ecran ou son orientation.
import { pivoterDesMetres } from '../carte/projection.js';

export const creerLesPointsDeLieux = (couche, auClicSurUnLieu = null) => {
  let marqueurs = [];
  let derniereProjection = null;

  const placer = (marqueur, projection) => {
    const pivote = pivoterDesMetres(marqueur.lieu.point.x, marqueur.lieu.point.y);
    const position = projection.versEcranMetrique(pivote.x, pivote.y, 0);
    marqueur.repere.style.transform =
      `translate(${position.x}px, ${position.y}px) translate(-50%, -100%)`;
  };

  const construire = (lieu) => {
    const repere = document.createElement(auClicSurUnLieu ? 'button' : 'span');
    repere.className = lieu.ajoutePar === 'invite' ? 'marqueur marqueur-invite' : 'marqueur';
    if (auClicSurUnLieu) {
      repere.type = 'button';
      repere.setAttribute('aria-label', `Lieu : ${lieu.nom}`);
      repere.addEventListener('click', () => auClicSurUnLieu(lieu));
    }

    const epingle = document.createElement('span');
    epingle.className = 'epingle';
    const etiquette = document.createElement('span');
    etiquette.className = 'etiquette';
    etiquette.textContent = lieu.nom;

    repere.append(epingle, etiquette);
    couche.append(repere);
    return { lieu, repere };
  };

  // Les lieux sans point place ne recoivent pas encore de repere.
  const definir = (lieux) => {
    for (const marqueur of marqueurs) marqueur.repere.remove();
    marqueurs = lieux.filter((lieu) => lieu.point).map(construire);
    if (derniereProjection) repositionner(derniereProjection);
  };

  function repositionner(projection) {
    derniereProjection = projection;
    for (const marqueur of marqueurs) placer(marqueur, projection);
  }

  return { definir, repositionner };
};
