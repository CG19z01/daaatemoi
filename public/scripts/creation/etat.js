// Etat de la creation en cours, cote navigateur. Rien n'est enregistre tant
// que le lien n'est pas partage : le serveur revalidera tout de toute facon.
export const LIEUX_MAXIMAUX = 5;
export const COULEUR_DU_POINT_PAR_DEFAUT = '#a30dad';
export const DISPONIBILITES_MAXIMALES = 12;

const abonnes = [];
let compteurDeCles = 0;

export const etat = { ville: null, lieux: [], disponibilites: [] };

export const surChangement = (rappel) => abonnes.push(rappel);

const signaler = () => {
  for (const rappel of abonnes) rappel(etat);
};

export const definirLaVille = (ville) => {
  etat.ville = ville;
  signaler();
};

// Chaque lieu recoit une cle locale : les disponibilites s'y rattachent sans
// dependre de sa position dans la liste, qui change a chaque suppression.
export const ajouterUnLieu = (lieu) => {
  if (etat.lieux.length >= LIEUX_MAXIMAUX) return null;
  compteurDeCles += 1;
  const ajoute = {
    couleur: COULEUR_DU_POINT_PAR_DEFAUT,
    ...lieu,
    cle: `lieu-local-${compteurDeCles}`,
  };
  etat.lieux.push(ajoute);
  signaler();
  return ajoute;
};

export const modifierUnLieu = (cle, modifications) => {
  etat.lieux = etat.lieux.map((lieu) => (lieu.cle === cle ? { ...lieu, ...modifications } : lieu));
  signaler();
};

export const retirerUnLieu = (cle) => {
  etat.lieux = etat.lieux.filter((lieu) => lieu.cle !== cle);
  // Une disponibilite qui visait ce lieu redevient libre plutot que fausse.
  etat.disponibilites = etat.disponibilites.map((creneau) =>
    creneau.cleDuLieu === cle ? { ...creneau, cleDuLieu: null } : creneau,
  );
  signaler();
};

export const trouverUnLieu = (cle) => etat.lieux.find((lieu) => lieu.cle === cle) ?? null;

export const ajouterUneDisponibilite = (creneau) => {
  if (etat.disponibilites.length >= DISPONIBILITES_MAXIMALES) return false;
  etat.disponibilites.push(creneau);
  signaler();
  return true;
};

export const remplacerUneDisponibilite = (rang, creneau) => {
  etat.disponibilites[rang] = creneau;
  signaler();
};

export const retirerUneDisponibilite = (rang) => {
  etat.disponibilites.splice(rang, 1);
  signaler();
};

// Forme attendue par le serveur : le lieu est designe par son rang.
export const composerLEnvoi = (motDePasse, confirmationDuMotDePasse) => ({
  villeCle: etat.ville?.cle ?? '',
  lieux: etat.lieux.map(({ cle, ...lieu }) => lieu),
  disponibilites: etat.disponibilites.map((creneau) => ({
    date: creneau.date,
    heureDeDebut: creneau.heureDeDebut,
    heureDeFin: creneau.heureDeFin,
    indexDuLieu: etat.lieux.findIndex((lieu) => lieu.cle === creneau.cleDuLieu),
  })),
  motDePasse,
  confirmationDuMotDePasse,
});
