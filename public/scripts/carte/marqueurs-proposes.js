// Points proposes par les visiteurs : memes reperes que les lieux choisis,
// dans la couleur retenue, mais sans fiche ni reservation.
import { versMetres } from './projection.js';

export const creerLesMarqueursProposes = (couche, lieuxProposes) => {
  const marqueurs = [];
  let derniereProjection = null;

  const placer = (marqueur, projection) => {
    const enMetres = versMetres(marqueur.lieu);
    const position = projection.versEcranMetrique(enMetres.x, enMetres.y, 0);
    marqueur.repere.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -100%)`;
  };

  const ajouter = (lieu) => {
    const repere = document.createElement('span');
    repere.className = 'marqueur marqueur-propose';

    const epingle = document.createElement('span');
    epingle.className = 'epingle';
    // Couleur choisie par la personne qui a propose le lieu.
    if (lieu.couleur) epingle.style.backgroundColor = lieu.couleur;

    const etiquette = document.createElement('span');
    etiquette.className = 'etiquette';
    etiquette.textContent = lieu.nom;

    repere.append(epingle, etiquette);
    couche.append(repere);

    const marqueur = { lieu, repere };
    marqueurs.push(marqueur);
    // Un point ajoute en cours de visite se place immediatement.
    if (derniereProjection) placer(marqueur, derniereProjection);
    return marqueur;
  };

  const repositionner = (projection) => {
    derniereProjection = projection;
    for (const marqueur of marqueurs) placer(marqueur, projection);
  };

  lieuxProposes.forEach(ajouter);
  return { ajouter, repositionner };
};
