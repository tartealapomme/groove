### Setup environnement Supabase (comme cours 5)

```bash
# Depuis le dossier groove
cp .env.example .env

# Installer les dépendances (CLI Supabase)
pnpm install

# Lancer l'émulateur Supabase en local (Docker)
pnpm supabase start -- --workdir ./supabase

# Plus tard : lancer ton app Nuxt sur http://127.0.0.1:3000
```

- **Docker / Supabase** : le CLI `supabase` utilise Docker en arrière-plan pour lancer Postgres, Auth, Storage, Studio, etc., avec la configuration de `supabase/config.toml`.
- **Variables d’environnement** : `NUXT_PUBLIC_SUPABASE_URL` et `NUXT_PUBLIC_SUPABASE_KEY` de `.env` seront utilisées par ton futur projet Nuxt via le module `@nuxtjs/supabase`, comme dans `cours-5-nuxt-terrains`.

Architecture Logicielle : BFF (Backend For Frontend)
Le serveur Nitro de Nuxt agit comme une couche intermédiaire entre le client et l'API Discogs.
Justification : Centralise la logique métier et sécurise les secrets (clés API) qui ne transitent jamais vers le navigateur.


Avantage : Permet de reformater les données de l'API externe avant l'affichage pour une interface plus fluide.



2. Modèle de Rendu : Rendu Universel (SSR)
Nuxt génère les pages côté serveur avant de les envoyer au client.
Justification : Indispensable pour le référencement (SEO) des fiches de vinyles et la performance perçue.


Avantage : Chargement initial rapide, idéal pour une application de type catalogue.



3. Architecture des Données : Relationnelle & RLS
Utilisation de PostgreSQL via Supabase avec des politiques de sécurité au niveau des lignes (Row Level Security).

Justification : Garantit l'intégrité des données entre les profils et leurs intérêts musicaux.


Avantage : Sécurité native : un utilisateur ne peut accéder qu'à ses propres favoris ou préférences.



4. Architecture Infrastructure : Serverless & CI/CD
Déploiement sur Vercel (Frontend/API) et Supabase Cloud (Base de données/Auth).
Justification : Infrastructure moderne sans gestion de serveur physique, facilitant le déploiement continu via GitHub.
Avantage : Mise à jour automatique du projet à chaque commit (Pipeline CI/CD).
1. Structure des dossiers
Nuxt utilise une structure par convention qui facilite la modularité:
/server/api/ : Contient la logique BFF (vos routes API privées).
/pages/ : Contient les vues de votre application (Routes).
/middleware/ : Contient la logique de protection des routes (Auth).
/composables/ : Contient la logique métier réutilisable.

2. Le Backend For Frontend (BFF)
Ce fichier masque votre clé API Discogs et traite les données avant de les envoyer au client
Nuxt & Supabase : L utilisation des modules officiels et des fonctions useSupabaseUser ou useSupabaseClient prouve la maîtrise des outils imposés.


Sécurité : Le passage par /server/api/ garantit qu aucune donnée sensible (API Keys) n est exposée au client.


Complexité API : L intégration de Discogs via une route Nitro démontre une capacité à gérer des flux de données externes complexes.


Modularité : La séparation entre les composants de présentation et la logique serveur répond au critère de "Qualité du code".
