// Etat de la page invitee : l'experience recue, la disponibilite retenue et
// les dates alternatives proposees. Rien n'est definitif avant l'envoi.
export const PROPOSITIONS_MAXIMALES = 3;
export const LIEUX_MAXIMAUX = 5;

const abonnes = [];

export const etat = { experience: null, rangChoisi: null, propositions: [] };

export const surChangement = (rappel) => abonnes.push(rappel);

const signaler = () => {
  for (const rappel of abonnes) rappel(etat);
};

export const definirLExperience = (experience) => {
  etat.experience = experience;
  // Une reponse deja envoyee est reprise telle quelle : l'invite peut la revoir.
  etat.rangChoisi = experience.reponse?.rendezVousChoisi?.rang ?? null;
  etat.propositions = (experience.reponse?.propositions ?? []).map((creneau) => ({
    date: creneau.date,
    heureDeDebut: creneau.heureDeDebut,
    heureDeFin: creneau.heureDeFin,
    identifiantDuLieu: creneau.identifiantDuLieu ?? null,
  }));
  signaler();
};

export const definirLesLieux = (lieux) => {
  etat.experience = { ...etat.experience, lieux };
  signaler();
};

export const choisirLaDisponibilite = (rang) => {
  etat.rangChoisi = etat.rangChoisi === rang ? null : rang;
  signaler();
};

export const ajouterUneProposition = (creneau) => {
  if (etat.propositions.length >= PROPOSITIONS_MAXIMALES) return false;
  etat.propositions.push(creneau);
  signaler();
  return true;
};

export const remplacerUneProposition = (rang, creneau) => {
  etat.propositions[rang] = creneau;
  signaler();
};

export const retirerUneProposition = (rang) => {
  etat.propositions.splice(rang, 1);
  signaler();
};

export const lieuxProposes = () =>
  (etat.experience?.lieux ?? []).map((lieu) => ({
    valeur: lieu.identifiant,
    nom: lieu.nom,
    horaires: lieu.horaires,
  }));

export const nomDuLieu = (identifiant) =>
  etat.experience?.lieux.find((lieu) => lieu.identifiant === identifiant)?.nom ?? null;
