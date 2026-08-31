// Routes publiques (lecture seule pour les lieux) protegees par la session visiteur.
import { Router } from 'express';
import { listeDesLieux, trouverLieu } from '../donnees/lieux.js';
import { enregistrerClic } from '../services/journal.js';
import { enregistrerReservation } from '../services/reservations.js';
import { prevenirDUnRendezVous } from '../services/notification.js';
import { formaterUneDateIso } from '../utilitaires/date-paris.js';
import { validerReservation, nettoyerTexte } from '../utilitaires/validation.js';
import { validerProposition } from '../utilitaires/validation-proposition.js';
import { traiterUneProposition } from '../services/propositions.js';
import { recupererLesLieuxProposes } from '../services/lieux-proposes.js';
import { ajouterUnTrait, recupererLeDessin } from '../services/dessin.js';
import { validerUnTrait } from '../utilitaires/validation-traits.js';
import { envoiAutorise } from '../middlewares/limitation.js';
import { identifierLeVisiteur } from '../middlewares/session-visiteur.js';
import { attraper } from '../utilitaires/asynchrone.js';

export const routesApi = Router();

routesApi.use(identifierLeVisiteur);

routesApi.get('/lieux', attraper(async (requete, reponse) => {
  reponse.json({ listeDesLieux, lieuxProposes: await recupererLesLieuxProposes() });
}));

// Journalise un clic sur un lieu (nom + horodatage Europe/Paris).
routesApi.post('/journal', attraper(async (requete, reponse) => {
  const identifiantDuLieu = nettoyerTexte(requete.body?.identifiantDuLieu, 60);
  const lieu = trouverLieu(identifiantDuLieu);
  if (!lieu) return reponse.status(400).json({ erreur: 'Lieu inconnu.' });
  const ligne = await enregistrerClic(lieu, requete.identifiantDeSession);
  return reponse.status(201).json({ horodatage: ligne.horodatage });
}));

routesApi.post('/reservations', attraper(async (requete, reponse) => {
  const { erreur, reservation } = validerReservation(requete.body);
  if (erreur) return reponse.status(400).json({ erreur });

  const { rendezVous, dejaEnregistre } = await enregistrerReservation(reservation);
  // La notification part seulement apres un enregistrement reellement nouveau,
  // et son echec eventuel ne remet pas le rendez-vous en cause.
  if (!dejaEnregistre) await prevenirDUnRendezVous(rendezVous);

  return reponse.status(201).json({
    message: `Rendez-vous noté : ${rendezVous.nomDuLieu}, le ${formaterUneDateIso(rendezVous.dateDeReservation)} à ${rendezVous.heureDeReservation}.`,
  });
}));

// Proposition libre d'un autre lieu de rendez-vous.
const ENVOIS_MAXIMAUX_PAR_VISITEUR = 5;

routesApi.post('/autre-endroit', attraper(async (requete, reponse) => {
  const { erreur, proposition } = validerProposition(requete.body);
  if (erreur) return reponse.status(400).json({ erreur });
  if (!envoiAutorise(requete, ENVOIS_MAXIMAUX_PAR_VISITEUR)) {
    return reponse.status(429).json({ erreur: 'Trop d’envois. Réessaie dans quelques minutes.' });
  }

  const { envoyee, lieuAjoute } = await traiterUneProposition(
    proposition,
    requete.identifiantDeSession,
  );
  // Le point retenu est renvoye : la carte l'affiche sans recharger la page.
  return reponse.status(201).json({
    message: envoyee
      ? 'C’est envoyé ! Je vais regarder pour cet endroit.'
      : 'C’est enregistré ! La notification n’est pas partie, mais je verrai ta proposition.',
    lieuPropose: lieuAjoute ?? null,
  });
}));

// Coloriage partage : lecture de l'ensemble des traits.
routesApi.get('/dessin', attraper(async (requete, reponse) => {
  reponse.json({ traits: await recupererLeDessin() });
}));

// Un trait termine rejoint le dessin commun.
routesApi.post('/dessin', attraper(async (requete, reponse) => {
  const { erreur, trait } = validerUnTrait(requete.body);
  if (erreur) return reponse.status(400).json({ erreur });
  await ajouterUnTrait(trait);
  return reponse.status(201).json({ message: 'Trait enregistré.' });
}));
