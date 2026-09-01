// Comptage des tentatives ratees, en memoire du processus. Sert a ralentir une
// attaque par essais repetes, sur l'administration comme sur les experiences.
// Sur une plateforme sans etat partage, chaque instance compte pour elle :
// c'est une gene serieuse pour l'attaquant, pas un verrou absolu.
const ENTREES_MAXIMALES = 2000;

export const creerCompteurDeTentatives = ({ maximum, fenetreEnMillisecondes }) => {
  const compteurs = new Map();

  const perimee = (compteur, maintenant) => maintenant - compteur.debut > fenetreEnMillisecondes;

  // La table est purgee des qu'elle grossit trop : la memoire reste bornee.
  const purger = (maintenant) => {
    if (compteurs.size < ENTREES_MAXIMALES) return;
    for (const [cle, compteur] of compteurs) {
      if (perimee(compteur, maintenant)) compteurs.delete(cle);
    }
  };

  return {
    tropDeTentatives: (cle) => {
      const compteur = compteurs.get(cle);
      if (!compteur || perimee(compteur, Date.now())) return false;
      return compteur.nombre >= maximum;
    },

    // Renvoie le nombre de tentatives ratees deja enregistrees pour cette cle.
    compter: (cle) => {
      const maintenant = Date.now();
      purger(maintenant);
      const compteur = compteurs.get(cle);
      if (!compteur || perimee(compteur, maintenant)) {
        compteurs.set(cle, { debut: maintenant, nombre: 1 });
        return 1;
      }
      compteur.nombre += 1;
      return compteur.nombre;
    },

    reinitialiser: (cle) => compteurs.delete(cle),
  };
};
