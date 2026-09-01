// Selecteur d'heure en deux listes : les heures d'un cote, les minutes de
// l'autre, toujours de 5 en 5. Les valeurs proposees suivent les horaires du
// lieu concerne ; sans horaires connus, la journee entiere est disponible.
import { heuresPossibles, minutesPossibles, plagesDeCreneaux } from './creneaux.js';

const remplir = (champ, valeurs, valeurSouhaitee) => {
  champ.replaceChildren();
  for (const valeur of valeurs) {
    const option = document.createElement('option');
    option.value = valeur;
    option.textContent = valeur;
    champ.append(option);
  }
  champ.disabled = valeurs.length === 0;
  if (valeurs.includes(valeurSouhaitee)) champ.value = valeurSouhaitee;
};

export const creerSelecteurDHeure = (champDesHeures, champDesMinutes) => {
  let plages = null;

  const rafraichirLesMinutes = (minutesSouhaitees) => {
    remplir(champDesMinutes, minutesPossibles(plages, champDesHeures.value), minutesSouhaitees);
  };

  champDesHeures.addEventListener('change', () => rafraichirLesMinutes(champDesMinutes.value));

  // horairesDuJour : null (libre), [] (ferme) ou la liste des plages.
  const definirLesHoraires = (horairesDuJour, heureSouhaitee = '') => {
    plages = plagesDeCreneaux(horairesDuJour);
    const [heures, minutes] = String(heureSouhaitee).split(':');
    remplir(champDesHeures, heuresPossibles(plages), heures);
    rafraichirLesMinutes(minutes);
  };

  return {
    definirLesHoraires,
    estIndisponible: () => champDesHeures.disabled || champDesHeures.value === '',
    valeur: () => `${champDesHeures.value}:${champDesMinutes.value}`,
  };
};
