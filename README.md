# Ramadan Game Hub 🌙

Une mini-plateforme de jeux en ligne pour étudiants, avec authentification, salons en temps réel, système de points et jeux interactifs.

## Fonctionnalités
- **Authentification** : Inscription et connexion via Supabase (Email/Mot de passe).
- **Salons (Rooms)** : Création et invitation via code. Chat en temps réel et système de "prêt".
- **Jeux** : Tic-Tac-Toe, Quiz Multi-thèmes, et Action / Vérité. Un système extensible (GameEngine) permet l'ajout futur d'autres jeux (Loup-garou, Échecs, etc.).
- **Leaderboard** : Classement compétitif avec attribution de points après chaque partie (voir vue SQL).

## Architecture & Stack
- **Frontend** : Next.js 14 (App Router), TypeScript, TailwindCSS, Zustand
- **Backend** : Node.js, Express, Socket.io
- **Base de données** : Supabase (PostgreSQL, Realtime, Auth)

## Prérequis
1. Un projet **Supabase** actif.
2. Node.js (v18+)

## Installation et Lancement

### 1. Base de données
- Dans votre projet Supabase, naviguez vers le **SQL Editor** et exécutez le contenu de `supabase/migrations/01_schema.sql`.

### 2. Configuration Environnement
- Dans `client/`, créez `.env.local` et ajoutez vos clés Supabase :
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
  NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
  ```

### 3. Backend (Serveur Socket)
```bash
cd server
npm install
npm run dev
```
Le serveur démarrera sur `http://localhost:4000`.

### 4. Frontend (Next.js)
Dans un nouveau terminal :
```bash
cd client
npm install
npm run dev
```
Le front-end sera accessible sur `http://localhost:3000`.

## Déploiement
- **Frontend** : Vercel (Liez votre dépôt GitHub et définissez le Root Directory sur `client/`). Ajoutez les variables d'environnement Supabase + URL du backend.
- **Backend** : Render ou Railway (Déployez le repo avec Root Directory `server/` et la commande de build `npm install && npm run build`, la commande de start `npm start`).
