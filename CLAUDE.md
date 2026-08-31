# CLAUDE.md

## Projet

Site web interactif de proposition de rendez-vous à Rouen.

Le projet doit être :

- léger
- rapide
- responsive
- sécurisé
- facile à maintenir
- visuellement fun
- romantique
- avec un style cartoon

---

# Règles prioritaires

Toujours respecter les règles suivantes avant d'écrire ou modifier du code.

1. Lire ce fichier avant toute modification.
2. Ne pas supprimer de fichier existant sans autorisation.
3. Ne pas créer de dépendance sans raison valable.
4. Préférer la solution la plus simple et légère.
5. Ne jamais dépasser 150 lignes dans un fichier source.
6. Découper les fichiers avant d'atteindre cette limite.
7. Ne pas contourner la limite avec du code compact ou illisible.
8. Toujours privilégier la lisibilité.
9. Toujours vérifier le projet après modification importante.
10. Corriger les erreurs détectées avant de terminer.

---

# Limite des fichiers

Aucun fichier source ne doit dépasser :

150 lignes

Cela concerne notamment :

- composants
- routes
- services
- utilitaires
- scripts
- styles si possible

Si un fichier approche 150 lignes :

1. identifier ses responsabilités
2. séparer les responsabilités
3. créer plusieurs modules cohérents
4. conserver des imports simples

Ne jamais créer un gros fichier central.

---

# Langue du code

Tous les noms créés dans le projet doivent être en français.

Cela concerne :

- variables
- constantes
- fonctions
- services
- fichiers métier
- types
- interfaces lorsque cela reste compatible avec la technologie utilisée

## Bons exemples

```text
listeDesLieux
lieuSelectionne
dateDeReservation
heureDeReservation
enregistrerReservation
recupererLesLieux
sessionActive
heureDuDernierAcces
journalDesClics
verifierAuthentification