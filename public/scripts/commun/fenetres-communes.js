// Insertion des fenetres partagees par la page de creation et la page invitee.
// Elles sont ecrites une seule fois, dans un fragment servi par le serveur :
// aucune duplication de balisage entre les deux pages.
const ADRESSE_DU_FRAGMENT = '/fragments/fenetres-communes.html';

export const chargerLesFenetresCommunes = async () => {
  const reponse = await fetch(ADRESSE_DU_FRAGMENT, { credentials: 'same-origin' });
  if (!reponse.ok) throw new Error('Fenêtres indisponibles.');
  // Le fragment vient du site lui-meme : rien d'exterieur n'est insere ici.
  const contenu = document.createRange().createContextualFragment(await reponse.text());
  document.body.append(contenu);
};
