# Ramadan Game Hub

**Ramadan Game Hub** est une mini‑plateforme de jeux multijoueur en ligne destinée aux étudiants.  Elle offre un système d’authentification, des salons, des parties en temps réel, un système de points et un tableau de classement.  Ce dépôt contient l’ensemble du code source (client Next.js, serveur Socket.io, migrations SQL pour Supabase) ainsi qu’un jeu de données de départ.

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Configuration de Supabase](#configuration-de-supabase)
- [Lancement en local](#lancement-en-local)
- [Déploiement](#déploiement)
- [Structure des répertoires](#structure-des-répertoires)
- [Jeux implémentés](#jeux-implémentés)
- [Notes de développement](#notes-de-développement)

## Architecture

Le projet est divisé en trois parties :

| Dossier        | Rôle                                                     |
|---------------|----------------------------------------------------------|
| `client`      | Application frontend Next.js 14 (App Router) avec Tailwind CSS, gestion de l’authentification via Supabase et connexion Socket.io côté client. |
| `server`      | Serveur Node/Express en TypeScript exposant un serveur Socket.io.  Ce serveur centralise la logique des jeux, la gestion des rooms et la distribution des évènements en temps réel. |
| `supabase`    | Migrations SQL et jeux de données pour créer la base de données sur Supabase. |

L’authentification est gérée par Supabase (email/mot de passe).  Après l’inscription, l’utilisateur choisit un *username* unique enregistré dans la table `profiles`.  Les points sont comptabilisés dans la table `points_ledger` et agrégés dans la vue `leaderboard_view`.

## Stack technique

- **Frontend :** Next.js 14 (App Router), TypeScript, Tailwind CSS, Socket.io‑client, Supabase JS.
- **Backend :** Node.js + Express, TypeScript, Socket.io, Supabase JS pour la validation JWT et l’accès aux données.
- **Base de données :** Supabase Postgres avec Row Level Security (RLS) activé (les migrations définissent les tables et la vue).
- **Déploiement :**
  - *Frontend :* Vercel
  - *Backend :* Render ou Railway (serveur Node/Express)
  - *Base de données :* Supabase

## Configuration de Supabase

1. Créez un projet Supabase depuis [supabase.com](https://supabase.com/).  Notez l’URL du projet et la clé `anon` (clé publique).  Activez l’authentification via email/mot de passe.
2. Dans la console SQL de Supabase, exécutez le script de migration fourni :

```sql
-- supabase/migrations/001_create_tables.sql
```

3. (Optionnel) Insérez les questions de quiz et les cartes Action/Vérité en utilisant les scripts seed :

```sql
\i supabase/seeds/quiz_seed.sql
\i supabase/seeds/truth_or_dare_seed.sql
```

4. Créez un fichier `.env.local` dans `client/` en définissant les variables suivantes :

```bash
NEXT_PUBLIC_SUPABASE_URL=<URL du projet Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anonyme Supabase>
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000  # URL du serveur Socket.io
```

5. Créez un fichier `.env` dans `server/` avec :

```bash
SUPABASE_URL=<URL du projet Supabase>
SUPABASE_SERVICE_ROLE_KEY=<clé de service pour le backend>
PORT=4000
```

La clé `SUPABASE_SERVICE_ROLE_KEY` n’est utilisée que côté serveur et ne doit pas être exposée publiquement.

## Lancement en local

Le projet est scindé en deux applications Node indépendantes :

1. **Installer les dépendances**

```bash
# à la racine du projet
cd client
npm install

cd ../server
npm install
```

2. **Exécuter le serveur Socket.io**

```bash
cd server
npm run dev
# écoute sur http://localhost:4000
```

3. **Exécuter le client Next.js**

```bash
cd client
npm run dev
# accès via http://localhost:3000
```

4. Ouvrez `http://localhost:3000` dans votre navigateur.  Vous pouvez créer un compte, rejoindre ou créer des rooms et tester les jeux.

## Déploiement

### Frontend (Vercel)

1. Créez un nouveau projet sur [vercel.com](https://vercel.com/) en liant le dossier `client`.  Vercel détectera automatiquement le framework Next.js.
2. Définissez les variables d’environnement `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_SOCKET_URL` dans la configuration Vercel.
3. Déployez.  L’application sera disponible sous l’URL fournie par Vercel.

### Backend (Render/Railway)

1. Créez un nouveau service Web (par exemple sur [render.com](https://render.com/) ou [railway.app](https://railway.app/)).  Pointez vers le dossier `server` comme répertoire source.
2. Choisissez un environnement Node (ex. Node 18 ou 20).  Dans la configuration du service, ajoutez les variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `PORT`.
3. Configurez la commande de démarrage à `npm run start`.
4. Déployez.  Notez l’URL du serveur et mettez-la dans `NEXT_PUBLIC_SOCKET_URL` (Vercel) pour que le client s’y connecte.

### Supabase

Les migrations SQL sont idempotentes et peuvent être rejouées sans risque.  Les seeds peuvent être exécutés pour peupler les questions.

## Structure des répertoires

```text
ramadan-game-hub/
├── client/                # Application Next.js
│   ├── app/               # App Router (pages)
│   │   ├── layout.tsx     # Layout global (dark theme, navbar)
│   │   ├── page.tsx       # Page d’accueil / Login/Signup
│   │   ├── lobby/page.tsx
│   │   ├── room/[code]/page.tsx
│   │   ├── room/[code]/game/[sessionId]/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   └── profile/page.tsx
│   ├── components/        # Composants React (Navbar, Chat, GameCards…)
│   ├── lib/               # Supabase client, hooks Socket
│   ├── styles/            # Feuilles de style Tailwind
│   ├── tailwind.config.js # Configuration Tailwind
│   └── tsconfig.json
├── server/                # Serveur Node/Express + Socket.io
│   ├── src/
│   │   ├── index.ts       # Point d’entrée
│   │   ├── games/         # Modules de jeux
│   │   │   ├── xo.ts
│   │   │   ├── quiz.ts
│   │   │   └── truthOrDare.ts
│   │   └── types.ts       # Interface commune pour les jeux
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   ├── migrations/        # Scripts SQL pour créer les tables et la vue
│   │   └── 001_create_tables.sql
│   └── seeds/             # Données de départ pour quiz et action/vérité
│       ├── quiz_seed.sql
│       └── truth_or_dare_seed.sql
└── README.md
```

## Jeux implémentés

### XO (Tic‑Tac‑Toe)

Jeu pour deux joueurs.  Les joueurs rejoignent une room, puis le propriétaire clique sur **Start Game**.  Le serveur instancie une partie et attribue les symboles (`X` et `O`).  Les joueurs jouent à tour de rôle en envoyant l’action `place_mark`.  Le serveur vérifie la validité du coup, met à jour l’état et renvoie l’évènement `game:state` à tous les clients.  La partie se termine lorsqu’un joueur aligne trois symboles ou que la grille est remplie.  Les points sont attribués conformément au barème.

### Quiz multi‑thèmes

Jeu pour 2 à 10 joueurs.  Le propriétaire de la room choisit un thème parmi ceux disponibles (Culture générale, Tech, Sport, Ramadan, Tunisie…).  Le serveur tire aléatoirement des questions stockées dans Supabase.  Chaque question a un timer (par défaut 15 s).  Les joueurs répondent via l’action `answer_choice`.  Les points sont calculés en fonction des bonnes réponses et de la rapidité.  À la fin du quiz, le serveur publie le classement et crédite les points.

### Action/Vérité (Truth or Dare)

Jeu pour 2 à 10 joueurs.  Les participants jouent à tour de rôle.  Au début de leur tour, ils choisissent soit une **Action** soit une **Vérité**, le serveur pioche une carte correspondante dans le dataset et l’envoie au joueur.  Une fois terminée, le joueur appuie sur **Done** pour passer le tour.  Aucun point n’est attribué pour ce jeu (c’est avant tout pour le fun).

### Architecture modulaire

Pour permettre d’ajouter de nouveaux jeux facilement, une interface TypeScript commune est définie à la fois côté serveur et côté client :

```ts
export interface GameModule<State, Action, Settings> {
  /**
   * Initialise une nouvelle partie avec les joueurs et les paramètres.
   */
  init(players: string[], settings: Settings): State;
  /**
   * Applique une action d’un joueur et retourne le nouvel état ainsi que les évènements
   * à envoyer aux clients (ex. mises à jour du score).  La logique métier est isolée
   * dans cette fonction.
   */
  applyAction(state: State, action: Action, playerId: string): { state: State; events?: any };
  /**
   * Indique si la partie est terminée.
   */
  isOver(state: State): boolean;
  /**
   * Retourne les gagnants et un résumé lorsque la partie est terminée.
   */
  getResult(state: State): { winners: string[]; summary: any };
}
```

Chaque jeu (XO, Quiz, Action/Vérité) implémente cette interface dans le dossier `server/src/games`.  Vous pouvez ajouter d’autres jeux (Loup‑garou, Draw & Guess, Chess, Chkobba, jeu de cartes Shedding) en créant de nouveaux fichiers dans ce dossier et en exposant les méthodes requises.

## Notes de développement

- Le code utilise **TypeScript strict** et la structure est volontairement claire pour faciliter la lecture et l’extension.  Des commentaires ont été ajoutés pour guider le développeur.
- Le serveur vérifie systématiquement que l’utilisateur qui envoie une action est bien membre de la room et que son tour est valide.  Cela empêche la triche côté client.
- Aucun secret (clé de service Supabase) n’est exposé côté client.  Les variables d’environnement sont utilisées avec `.env.local` et `.env`.
- Les states des parties sont sauvegardés en mémoire dans le serveur Socket.io.  Pour un usage en production, il est recommandé de persister l’état dans Supabase ou Redis afin de pouvoir redémarrer le serveur sans perdre les parties en cours.
