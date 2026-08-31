// Mise en forme partagee des dates dans l'administration.
export const enDateFrancaise = (dateIso) => {
  const [annee, mois, jour] = String(dateIso).split('-');
  return jour && mois && annee ? `${jour}/${mois}/${annee}` : String(dateIso);
};
