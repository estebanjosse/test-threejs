# Crystal Escape — exploration complémentaire Three.js / Babylon.js

Date de collecte : 3 octobre 2026 UTC. Suite explicitement autorisée par Esteban.
Branche exclusive : `exploration/hermes-baseline-2026-10-03`.
Aucun merge, déploiement, publication, nouveau moteur ou changement de lockfile.
Le commit contenant ce rapport identifie les changements ; `results.json` conserve
le SHA de départ de chaque dépôt. Aucun moteur n'est retenu.

## Résultats vérifiés

Dans les deux jeux : départ réel par clic Playwright ; déplacement via événements
clavier dans Chromium ; collision avec la frontière sud ; collecte des cinq
cristaux et victoire au portail ; collisions sentinelles jusqu'à énergie zéro et
défaite ; restart après chacune des deux fins ; reset via la marque.
Les overlays victoire/défaite sont visibles dans les captures, pas seulement un
état simulé. À 640×360, HUD et touches mobiles restent visibles en transparence
derrière le résultat : observation UX mineure, non corrigée ; pas une validation
de la matrice responsive ni de clics tactiles physiques. Chaque parcours a été exécuté une fois intégralement, pas une campagne
statistique de fiabilité. Les répétitions concernent les mesures de chargement/rAF.

| Contrôle | Three.js | Babylon.js |
|---|---|---|
| Frontière sud | z=11.285 stable malgré maintien supplémentaire | identique |
| Victoire | 5/5, énergie 3, 25.45 s de jeu ; 384.72 s murales de parcours | 5/5, énergie 3, 25.45 s de jeu ; 307.91 s murales |
| Défaite | énergie 0, 7.10 s de jeu ; 92.50 s murales | énergie 0, 8.25 s de jeu ; 107.43 s murales |
| Restart victoire/défaite | playing=true, ended=false, énergie 3, cristaux 0, elapsed <0.11 s | identique |
| Événement blur synthétique | touches libérées après correctif TDD | déjà implémenté ; vérifié |
| Perte de focus native | non validée : changement d'onglet headless sans blur | même limite |

La défaite collecte incidemment un cristal avant les contacts avec les sentinelles.
Les durées des parcours ne sont **pas** un benchmark moteur (patrouilles et timings
variables, un seul essai, observation et polling présents).

## Diagnostic timer / déplacement

Hypothèses examinées : cadence de rendu trop faible avec delta plafonné ; événement
clavier trop bref/code erroné ; focus absent ; exception interrompant la boucle.
Le maintien CDP de `KeyW` pendant 3 s a bien déplacé le personnage Three de
z=9.5 à z=8.99, mais elapsed était seulement 0.2 s et l'affichage restait 00:00.
Les deux boucles plafonnent delta à 0.05 s, le timer additionne ce delta, le
mouvement utilise 5.1*delta et l'affichage tronque à la seconde entière. Sous
SwiftShader avec des intervalles rAF d'environ 0.6–0.9 s, le temps simulé est donc
fortement inférieur au temps mural. Les parties gagnées montrent bien la progression
jusqu'à 00:25. Ce comportement explique le symptôme actuel ; il ne reconstitue pas
exactement la séquence historique de la baseline ni ne prouve un bug à cadence native.
Aucune modification de vitesse, timer, collisions ou sentinelles n'a été faite.
Une touche pressée puis relâchée sans frame intermédiaire ne garantit pas un déplacement.
Les captures/logs ne montrent pas d'erreur JS dans la fenêtre observée après départ ;
la capture d'erreurs ne couvre pas exhaustivement l'initialisation antérieure.

## Changements bornés et TDD

Même ajout dans les deux moteurs : `src/exploration.js`, `installObservation`,
avec une seule fonction d'observation globale `crystalObservation()` activée
uniquement par `?exploration=1`. Copie structurée du snapshot ; pas de setter,
teleport, collecte forcée, invocation directe de finish/damage ni horloge accélérée.
Le test opt-in/copies a d'abord échoué par assertion « observation feature missing »
dans chaque dépôt, puis passé. Les logs rouge/vert sont conservés.
La première tentative de test avec import statique absent produisait une erreur de
chargement ; elle a été remplacée par une assertion explicite avant implémentation.

Comparaison d'effort : ajout identique de ce module et d'un callback dans main.js ;
écriture+exécution du test mesurées 1.71 s Three et 1.49 s Babylon. Ces valeurs
excluent conception, découverte et rédaction, ne constituent pas une comparaison
fiable de productivité des moteurs. Le gros effort a été le harness/navigateur commun.

Correctif Three seulement : ajout du listener blur qui vide les touches, déjà présent
chez Babylon. Le test VM exécute les vrais listeners extraits de main.js avec un
EventTarget : rouge Three (1 touche persistante), vert Babylon avant modification,
puis vert dans les deux. Ce test de seam n'est pas un test de DOM complet.
Le navigateur vérifie aussi le blur synthétique. Le blur natif a été tenté dans le
browser harness et dans Chromium local : aucun événement blur, document.hasFocus
restant true. Ne pas présenter ce test synthétique comme validation native/mobile.
Deux tests Node passent par dépôt ; build final vérifié, warning chunk >500 kB Babylon.

## Protocole de mesure identique

Build Vite production preview, ports 4321/4322, HTTP loopback ; même Chromium
HeadlessChrome/153.0.8010.12, viewport 640×360, DPR 1, WebGL2, même SwiftShader
ANGLE/Vulkan. Cache HTTP désactivé via CDP, trois navigations par moteur, 5 s de
warm-up après load/présence de l'observateur, puis 20 s murales de rAF au menu sans jeu.
Collecte PerformanceNavigationTiming et ResourceTiming ; aucune taille gzip calculée
sur disque substituée au transfert observé. Les tailles ci-dessous excluent les
origines externes et additionnent document et ressources locales effectivement chargées.
Une copie de la première série browser-harness est conservée séparément ; le tableau
ci-dessous utilise **seulement** la série finale locale commune, pas un mélange.

| Démo | Essai | loadEventEnd ms | rAF médiane ms | rAF p95 ms | Intervalles | transferSize local octets |
|---|---:|---:|---:|---:|---:|---:|
| test-threejs | 1 | 765.4 | 683.3 | 783.3 | 29 | 130,276 |
| test-threejs | 2 | 1403.7 | 699.9 | 883.3 | 28 | 130,276 |
| test-threejs | 3 | 1017.5 | 700.0 | 800.0 | 31 | 130,276 |
| test-Babylonjs | 1 | 1222.8 | 699.9 | 783.3 | 29 | 343,495 |
| test-Babylonjs | 2 | 1379.6 | 616.5 | 700.1 | 36 | 343,495 |
| test-Babylonjs | 3 | 1108.3 | 616.7 | 783.3 | 30 | 343,495 |

Corps locaux encodés/décodés, identiques entre les trois essais de chaque démo :
Three 129,376 / 503,010 octets ; Babylon 336,295 / 1,385,664 octets.
ResourceTiming constate la différence encodé/décodé ; aucune hypothèse de compression
uniforme ou d'octets réseau sur le fil n'est nécessaire. transferSize comprend
l'overhead exposé par le navigateur, pas un relevé réseau paquet par paquet.
Les chunks Babylon de shaders réellement demandés sont inclus, les chunks dist
non chargés ne le sont pas. Les requêtes de fonts externes sont enregistrées dans
le JSON brut mais exclues des totaux locaux. Aucune ressource WASM observée.

**Limites majeures :** rAF mesure la cadence des callbacks, pas le temps GPU par
frame, ni des FPS natifs fiables. loadEventEnd ne mesure pas la première image
utilisable/acceptée. Ordre fixe Three×3 puis Babylon×3, pas alternance randomisée,
shader/driver warm-up non réinitialisé, machine partagée, pas d'IC statistique.
Les scènes partagent règles, carte, positions et vitesse, mais pas le rendu exact :
matériaux/lumières/glow diffèrent, poussière 420 points Three contre 220 instances
Babylon. Ces mesures caractérisent **ces builds dans cet environnement**, pas une
supériorité générale d'un moteur. Mémoire, GPU matériel, tactile physique, acceptation
humaine, backend score et intégration iframe ne sont pas validés ici.

## Preuves, problèmes rencontrés et reproduction

Artefacts dans `docs/evidence/followup/` : `results.json`, `performance.json`,
`browser-harness-performance.json`, `basic-play.json`, `victory-play.json`,
`loss-play.json`, `restart-after-*.json`, `focus-real-local.json`, captures
`intro.png`, `boundary.png`, `victory-final.png`, `loss-final.png`, `restart.png`,
logs TDD/tests/builds/exécution et `performance-console.json`.
Les logs de runner partagés contiennent les deux démos dans l'ordre indiqué.
Aucun secret, node_modules ni dist commité. Conservation des logs autorisée
explicitement par cette demande, au-delà de la restriction de baseline.

Le premier parcours Three a été interrompu par le timeout de l'outil terminal,
malgré quatre cristaux collectés ; son JSON et son log EPIPE sont conservés.
Une tolérance de waypoint trop large (0.20) approchait trop un pilier ; ajustée
à 0.13 dans le harness commun, sans changer la collision du jeu. La reprise
complète a ensuite validé les deux fins dans les deux jeux (exit 0).
Le browser harness `crystal-followup` a perdu CDP (« no close frame ») et sa reprise
Page.enable a échoué. Alternative réellement exécutée : Playwright local isolé,
pas de données simulées en remplacement. Le build Three a rencontré EAGAIN puis
un timeout ; le retry direct Vite avec threads limités a réussi. Des refus de
création de thread ont aussi été observés dans l'environnement partagé.
La console finale contient des warnings GPU « stall due to ReadPixels », pas
une mesure de GPU natif ; requestFailures=[] dans la fenêtre enregistrée.

Commandes effectivement utilisées (depuis l'un des deux dépôts autorisés) :

```sh
node --test tests/*.test.mjs
GOMAXPROCS=2 UV_THREADPOOL_SIZE=1 node node_modules/vite/bin/vite.js build
npm run preview -- --host 0.0.0.0 --port 4321 # Three
npm run preview -- --host 0.0.0.0 --port 4322 # Babylon, dans son dépôt
/opt/data/cache/scratch/followup-venv/bin/python scripts/exploration-local.py play
/opt/data/cache/scratch/followup-venv/bin/python scripts/exploration-local.py performance
/opt/data/cache/scratch/followup-venv/bin/python scripts/exploration-focus.py
```

Les deux serveurs doivent être disponibles avant les runners. Playwright 1.63.0
est épinglé dans `scripts/requirements-exploration.txt`. Le runner nécessite un
Python où cette dépendance est installée et un Chromium compatible ; définir
`CRYSTAL_CHROMIUM` pour remplacer le chemin local testé. Le runner mesure/joue
les deux dépôts frères, ne touche à aucun autre dépôt. `exploration-browser.py`
peut aussi être exécuté via browser_exec en session nommée crystal-followup.
Les parcours utilisent des événements KeyboardEvent non trusted dans la vraie
boucle de rendu ; les contrôles initiaux utilisent CDP/Playwright. Il s'agit de
playtests automatisés instrumentés, pas d'une revue humaine ni d'un test tactile.
Les JSON/captures exposent les limites plutôt que masquer les essais interrompus.

Instructions projet : charger le skill ai-game-platform-brain pour consulter le
contexte pertinent et capitaliser les résultats durables dans le brain via MCP.
Le contexte a été transmis par le principal ; aucune écriture brain par ce sous-agent.
La capitalisation et le compte rendu Telegram appartiennent au principal.
