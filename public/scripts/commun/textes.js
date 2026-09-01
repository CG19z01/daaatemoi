// Zones de texte posées sur la carte. Leur position est retenue en mètres
// bruts, jamais en pixels : le texte reste au même endroit de la ville sur
// n'importe quel écran, et après une rotation ou un redimensionnement.
import { pivoterDesMetres, redresserDesMetres } from '../carte/projection.js';

const DEPLACEMENT_MINIMAL = 6;

export const creerLaCoucheDeTextes = (couche, { auTexteChoisi, auChangement }) => {
  let elements = [];
  let derniereProjection = null;
  let modificationActive = false;

  const placer = ({ texte, element }) => {
    if (!derniereProjection) return;
    const pivote = pivoterDesMetres(texte.point.x, texte.point.y);
    const position = derniereProjection.versEcranMetrique(pivote.x, pivote.y, 0);
    element.style.transform = `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`;
    element.style.color = texte.couleur;
    element.style.fontSize = `${texte.taille}px`;
    element.textContent = texte.contenu;
  };

  // Un appui déplace le texte ; un appui sans déplacement l'ouvre à la modification.
  const brancherLeDeplacement = (entree) => {
    const { element } = entree;
    let origine = null;

    element.addEventListener('pointerdown', (evenement) => {
      if (!modificationActive) return;
      evenement.stopPropagation();
      element.setPointerCapture(evenement.pointerId);
      origine = { x: evenement.clientX, y: evenement.clientY, deplace: false };
    });

    element.addEventListener('pointermove', (evenement) => {
      if (!origine || !derniereProjection) return;
      const ecart = Math.hypot(evenement.clientX - origine.x, evenement.clientY - origine.y);
      if (ecart < DEPLACEMENT_MINIMAL) return;
      origine.deplace = true;
      const zone = couche.getBoundingClientRect();
      const vue = derniereProjection.versMetriqueDepuisEcran(
        evenement.clientX - zone.left,
        evenement.clientY - zone.top,
      );
      const brut = redresserDesMetres(vue.x, vue.y);
      entree.texte.point = { x: Math.round(brut.x), y: Math.round(brut.y) };
      placer(entree);
    });

    for (const nom of ['pointerup', 'pointercancel']) {
      element.addEventListener(nom, () => {
        if (!origine) return;
        const deplace = origine.deplace;
        origine = null;
        if (deplace) auChangement?.();
        else auTexteChoisi?.(entree.texte);
      });
    }
  };

  const construire = (texte) => {
    const element = document.createElement('span');
    element.className = 'texte-de-carte';
    const entree = { texte, element };
    placer(entree);
    brancherLeDeplacement(entree);
    couche.append(element);
    return entree;
  };

  const definir = (textes) => {
    for (const entree of elements) entree.element.remove();
    // Chaque texte est recopié : la couche possède son propre état.
    elements = textes.map((texte) => construire({ ...texte, point: { ...texte.point } }));
  };

  const ajouter = (texte) => {
    elements.push(construire(texte));
    auChangement?.();
  };

  const retirer = (texte) => {
    const entree = elements.find((candidat) => candidat.texte === texte);
    if (!entree) return;
    entree.element.remove();
    elements = elements.filter((candidat) => candidat !== entree);
    auChangement?.();
  };

  const rafraichir = (texte) => {
    const entree = elements.find((candidat) => candidat.texte === texte);
    if (entree) placer(entree);
    auChangement?.();
  };

  return {
    definir,
    ajouter,
    retirer,
    rafraichir,
    liste: () => elements.map((entree) => entree.texte),
    repositionner: (projection) => {
      derniereProjection = projection;
      for (const entree of elements) placer(entree);
    },
    definirLaModification: (actif) => {
      modificationActive = actif;
      couche.classList.toggle('textes-modifiables', actif);
    },
  };
};
