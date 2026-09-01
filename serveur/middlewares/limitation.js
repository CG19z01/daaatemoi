// Limitation des envois repetes, en memoire du processus.
// Seuls les envois reellement tentes sont comptes : une saisie invalide,
// corrigee puis renvoyee, ne doit pas bloquer le visiteur.
const FENETRE_EN_MILLISECONDES = 10 * 60 * 1000;

const compteurs = new Map();

// Chaque usage a son propre compteur : une recherche de lieux ne consomme pas
// le quota de creation, et inversement.
const cleDuVisiteur = (requete, nomDuCompteur) =>
  `${nomDuCompteur}|${requete.identifiantDeSession ?? 'sans-session'}|${requete.ip ?? 'inconnue'}`;

// Compteur lie a la seule adresse : vider ses cookies ne le remet pas a zero.
// Il protege les appels couteux, qui interrogent des services exterieurs.
const cleDeLAdresse = (requete, nomDuCompteur) =>
  `${nomDuCompteur}|adresse|${requete.ip ?? 'inconnue'}`;

const autoriser = (cle, nombreMaximal) => {
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

export const envoiAutorise = (requete, nombreMaximal, nomDuCompteur = 'envois') =>
  autoriser(cleDuVisiteur(requete, nomDuCompteur), nombreMaximal);

export const envoiAutoriseParAdresse = (requete, nombreMaximal, nomDuCompteur) =>
  autoriser(cleDeLAdresse(requete, nomDuCompteur), nombreMaximal);
