# Baseline d’exploration — test-threejs

Date : 2026-10-03 UTC.
Base main : `022756037c62d6508a4a81386bc15995cbd8d6e6`.
Branche : `exploration/hermes-baseline-2026-10-03`.
Le commit de ce rapport identifie l'état exploré ; aucun gameplay modifié.

## Objectif
Crystal Escape : référence Three.js ; comparer au Babylon équivalent, inputs, collisions, restart, bundle et intégration iframe.
Contribuer à la Factory et à la chaîne publication/partie/score ; pas arbitrer la stack sur un seul build.

## Inspection et résultats
Build OK ; aucun script de test automatisé. Smoke navigateur : rendu du sanctuaire et canvas observés, bouton de départ masque le menu, aucune erreur window/unhandledrejection capturée. Touche W envoyée, mais déplacement et timer non vérifiés (timer encore 00:00) ; aucune victoire/restart validée. Bonne référence pour comparatif équivalent Babylon.

## Reproduction
Environnement exécuté : Node v26.5.1, npm 11.17.0, Linux ; ce n'est pas un benchmark matériel.
Répertoire : `.`. Dépendances installées depuis le lockfile, lifecycle scripts désactivés.

- `npm ci --ignore-scripts --no-audit --no-fund` : exit 0. Durée observée 6.3 s (exécutions concurrentes, pas une mesure comparée).
- `npm run build` : exit 0. Durée observée 9.42 s (exécutions concurrentes, pas une mesure comparée).

Versions verrouillées : three 0.180.0, vite 7.3.6.

Mesures locales, gzip Python niveau 9, chaque fichier séparément ; pas des octets réellement transférés ni du cache navigateur :
- Distribution entière : 502,502 octets bruts ; 128,146 gzip.
- JavaScript total : 124,568 octets gzip.
- Avertissement de chunk >500 kB : non.

## Limites communes
Pas d'acceptation humaine, de benchmark FPS/mémoire/démarrage, de tactile réel,
de score backend, publication/versioning ou intégration iframe validée.
Smoke CDP ponctuel, pas une campagne QA navigateur. Les résultats historiques
du brain restent distincts de cette baseline. Ni Docker/GHCR ni Pages déployés.

## Suite proposée — non lancée
1. Playtests reproductibles des démos : démarrage, déplacements, collisions,
   défaite/victoire, restart, perte de focus ; preuve navigateur et revue humaine.
2. Comparatif Crystal Escape Three/Babylon à gameplay, navigateur et mesures
   équivalents : transfert réellement chargé, démarrage, frame time, mémoire,
   responsive et effort pour une même modification bornée.
3. Export Web Godot 4.5.1 + iframe/pointer lock ; traiter séparément la pipeline
   Blender/GLB et le budget du T-rex ; qualifier une shortlist de skills.
4. Petit laboratoire commun (repo privé proposé, non créé) : iframe sandbox,
   événements ready/start/end/score versionnés, validation des messages et
   tests de contrat. Pas de backend de production à ce stade.
5. Le game-generator-template cité dans le brain n'est pas dans les dépôts
   actuellement partagés ; demander l'accès pour explorer le candidat DSL/Rapier.

Toute nouvelle implémentation attend l'accord d'Esteban ; aucun moteur retenu.
