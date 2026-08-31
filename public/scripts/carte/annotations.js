// Annotations explicatives : chaque croix ferme uniquement la sienne.
export const brancherLesAnnotations = () => {
  for (const croix of document.querySelectorAll('.fermer-annotation')) {
    croix.addEventListener('click', () => {
      croix.closest('.annotation').hidden = true;
    });
  }
};
