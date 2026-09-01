// « Proposer une autre date » : jusqu'a trois creneaux, tous differents.
import {
  etat,
  surChangement,
  ajouterUneProposition,
  remplacerUneProposition,
  retirerUneProposition,
  lieuxProposes,
  nomDuLieu,
  PROPOSITIONS_MAXIMALES,
} from './etat.js';
import { ouvrirLaFenetreDeCreneau } from '../commun/fenetre-de-creneau.js';
import { creerUneLigneDeCreneau } from '../commun/creneau-affiche.js';

const enCreneau = (resultat) => ({
  date: resultat.date,
  heureDeDebut: resultat.heureDeDebut,
  heureDeFin: resultat.heureDeFin,
  identifiantDuLieu: resultat.valeurDuLieu,
});

export const brancherLesPropositions = () => {
  const liste = document.getElementById('listeDesPropositions');
  const bouton = document.getElementById('boutonProposerUneDate');
  const compteur = document.getElementById('compteurDesPropositions');

  const ouvrir = (creneau, auResultat) =>
    ouvrirLaFenetreDeCreneau({
      titre: creneau ? 'Modifier ma proposition' : 'Proposer une autre date',
      lieux: lieuxProposes(),
      creneau: creneau ? { ...creneau, valeurDuLieu: creneau.identifiantDuLieu } : {},
      auResultat: (resultat) => auResultat(enCreneau(resultat)),
    });

  const rafraichir = () => {
    liste.replaceChildren(
      ...etat.propositions.map((creneau, rang) =>
        creerUneLigneDeCreneau(creneau, nomDuLieu(creneau.identifiantDuLieu), {
          auxModifications: () => ouvrir(creneau, (modifie) => remplacerUneProposition(rang, modifie)),
          auRetrait: () => retirerUneProposition(rang),
        }),
      ),
    );
    compteur.textContent = `${etat.propositions.length} / ${PROPOSITIONS_MAXIMALES}`;
    bouton.disabled = etat.propositions.length >= PROPOSITIONS_MAXIMALES;
  };

  bouton.addEventListener('click', () => ouvrir(null, ajouterUneProposition));
  surChangement(rafraichir);
};
