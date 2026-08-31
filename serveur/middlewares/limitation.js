// Limitation des envois repetes, en memoire du processus.
// Seuls les envois reellement tentes sont comptes : une saisie invalide,
// corrigee puis renvoyee, ne doit pas bloquer le visiteur.
const FENETRE_EN_MILLISECONDES = 10 * 60 * 1000;

const compteurs = new Map();

const cleDuVisiteur = (requete) =>
  `${requete.identifiantDeSession ?? 'sans-session'}|${requete.ip ?? 'inconnue'}`;

export const envoiAutorise = (requete, nombreMaximal) => {
  const cle = cleDuVisiteur(requete);
  const compteur = compteurs.get(cle);
  const maintenant = Date.now();

  if (!compteur || maintenant - compteur.debut > FENETRE_EN_MILLISECONDES) {
    compteurs.set(cle, { debut: maintenant, nombre: 1 });
    return true;
  }
  if (compteur.nombre >= nombreMaximal) return false;
  compteur.nombre += 1;
  return true;
};
