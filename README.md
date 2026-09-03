# Crystal Escape

Mini-donjon 3D créé avec Three.js. Récupérez les cinq cristaux, évitez les gardiens et rejoignez le portail.

## Lancer le jeu

```bash
npm install
npm run dev
```

Puis ouvrez l’URL indiquée par Vite.

## Conteneur Docker

Construire et lancer l’image localement :

```bash
docker build -t crystal-escape .
docker run --rm -p 8080:8080 crystal-escape
```

Le jeu est alors disponible sur <http://localhost:8080>. Le conteneur utilise Nginx sans privilèges et expose un contrôle de santé sur `/healthz`.

Avec Docker Compose :

```bash
docker compose up --build
```

## Image GitHub Container Registry

La CI vérifie le build sur les pull requests. À chaque push sur `main` ou sur un tag `v*`, elle publie l’image sur :

```text
ghcr.io/estebanjosse/test-threejs
```

Exemple :

```bash
docker pull ghcr.io/estebanjosse/test-threejs:latest
docker run --rm -p 8080:8080 ghcr.io/estebanjosse/test-threejs:latest
```

Les tags de version comme `v1.0.0` produisent également les tags OCI `1.0.0`, `1.0`, `1` et `latest`.

Le premier package GHCR est généralement privé. Sa visibilité peut être changée dans **GitHub → Packages → Package settings** si l’image doit être récupérable sans authentification.

## Contrôles

- Flèches ou `WASD` / `ZQSD` : déplacement
- Contrôles tactiles disponibles sur mobile

## Stack

- Three.js
- Vite
- Modèles et décors générés procéduralement, sans ressources externes
