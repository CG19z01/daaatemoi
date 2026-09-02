// Branchement souris et tactile du coloriage, et blocage des gestes de zoom
// ou de deplacement : l'illustration doit rester parfaitement fixe.
const positionDansLaScene = (scene, evenement) => {
  const zone = scene.getBoundingClientRect();
  return { x: evenement.clientX - zone.left, y: evenement.clientY - zone.top };
};

const empecherLeGeste = (evenement) => evenement.preventDefault();

const bloquerLesGestesDeZoom = (scene) => {
  scene.addEventListener('wheel', empecherLeGeste, { passive: false });
  scene.addEventListener('dblclick', empecherLeGeste);
  scene.addEventListener('contextmenu', empecherLeGeste);
  for (const geste of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(geste, empecherLeGeste, { passive: false });
  }
};

// Le coloriage libre demande un appui : la carte ne se colore pas au simple survol.
// estSuspendu dit quand le geste sert a autre chose — placer un point, poser un
// texte — et que le feutre doit donc se taire.
export const brancherLaColoration = (scene, coloration, estSuspendu) => {
  let dessinEnCours = false;

  const ajouterDepuisLEvenement = (evenement) => {
    const evenementsGroupes = evenement.getCoalescedEvents
      ? evenement.getCoalescedEvents()
      : [evenement];
    for (const groupe of evenementsGroupes) {
      const position = positionDansLaScene(scene, groupe);
      coloration.ajouterPoint(position.x, position.y);
    }
  };

  scene.addEventListener('pointerdown', (evenement) => {
    // Un clic sur un point appelle sa propre action : on ne dessine pas dessus.
    if (evenement.target.closest('.marqueur')) return;
    // Pendant le placement d'un point, l'appui sert a viser, pas a colorier.
    if (estSuspendu()) return;
    dessinEnCours = true;
    ajouterDepuisLEvenement(evenement);
  });
  scene.addEventListener(
    'pointermove',
    (evenement) => {
      if (dessinEnCours) ajouterDepuisLEvenement(evenement);
    },
    { passive: true },
  );
  for (const evenement of ['pointerup', 'pointercancel', 'pointerleave']) {
    scene.addEventListener(evenement, () => {
      dessinEnCours = false;
      coloration.interrompreLeTrait();
    });
  }
  bloquerLesGestesDeZoom(scene);
};
