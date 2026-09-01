// Disponibilites du createur : plusieurs dates, chacune avec un creneau horaire
// respectant les horaires du lieu choisi.
import {
  etat,
  surChangement,
  ajouterUneDisponibilite,
  remplacerUneDisponibilite,
  retirerUneDisponibilite,
  trouverUnLieu,
  DISPONIBILITES_MAXIMALES,
} from './etat.js';
import { ouvrirLaFenetreDeCreneau } from '../commun/fenetre-de-creneau.js';
import { creerUneLigneDeCreneau } from '../commun/creneau-affiche.js';

const lieuxProposes = () =>
  etat.lieux.map((lieu) => ({ valeur: lieu.cle, nom: lieu.nom, horaires: lieu.horaires }));

const enCreneauLocal = (resultat) => ({
  date: resultat.date,
  heureDeDebut: resultat.heureDeDebut,
  heureDeFin: resultat.heureDeFin,
  cleDuLieu: resultat.valeurDuLieu,
});

export const brancherLesDisponibilites = () => {
  const liste = document.getElementById('listeDesDisponibilites');
  const bouton = document.getElementById('boutonAjouterUneDate');

  const ouvrir = (creneau, auResultat) =>
    ouvrirLaFenetreDeCreneau({
      titre: creneau ? 'Modifier la disponibilité' : 'Nouvelle disponibilité',
      lieux: lieuxProposes(),
      creneau: creneau ? { ...creneau, valeurDuLieu: creneau.cleDuLieu } : {},
      auResultat: (resultat) => auResultat(enCreneauLocal(resultat)),
    });

  const rafraichir = () => {
    liste.replaceChildren(
      ...etat.disponibilites.map((creneau, rang) =>
        creerUneLigneDeCreneau(creneau, trouverUnLieu(creneau.cleDuLieu)?.nom ?? null, {
          auxModifications: () => ouvrir(creneau, (modifie) => remplacerUneDisponibilite(rang, modifie)),
          auRetrait: () => retirerUneDisponibilite(rang),
        }),
      ),
    );
    bouton.disabled = etat.disponibilites.length >= DISPONIBILITES_MAXIMALES || !etat.ville;
  };

  bouton.addEventListener('click', () => ouvrir(null, ajouterUneDisponibilite));
  surChangement(rafraichir);
  rafraichir();
};
