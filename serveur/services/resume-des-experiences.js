// Vue des experiences pour l'administration : ce qui est utile a suivre, et
// rien d'autre. L'empreinte du mot de passe n'est jamais reprise ici.
import { listerLesExperiences } from './experiences.js';
import { composerLeLien } from './slug.js';

const decrireUnCreneau = (creneau, lieux) => {
  if (!creneau) return null;
  const lieu = lieux.find((candidat) => candidat.identifiant === creneau.identifiantDuLieu);
  return {
    date: creneau.date,
    heureDeDebut: creneau.heureDeDebut,
    heureDeFin: creneau.heureDeFin,
    nomDuLieu: lieu?.nom ?? null,
  };
};

export const resumerLesExperiences = async () => {
  const experiences = await listerLesExperiences();
  return experiences.map((experience) => {
    const lieux = experience.lieux ?? [];
    return {
      slug: experience.slug,
      lien: composerLeLien(experience.slug),
      ville: experience.ville?.nom ?? '—',
      pays: experience.ville?.pays ?? '',
      dateDeCreation: experience.dateDeCreation,
      nombreDeLieux: lieux.length,
      nombreDeDisponibilites: (experience.disponibilites ?? []).length,
      rendezVousChoisi: decrireUnCreneau(experience.reponse?.rendezVousChoisi, lieux),
      propositions: (experience.reponse?.propositions ?? []).map((creneau) =>
        decrireUnCreneau(creneau, lieux),
      ),
      horodatageDeLaReponse: experience.reponse?.horodatage ?? null,
    };
  });
};
