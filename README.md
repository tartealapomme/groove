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

---

## Répartition du Travail (3 Personnes)

### Architecture de Collaboration

Basée sur le pattern BFF (Backend-for-Frontend) avec séparation claire des responsabilités :

```
groove/
├── server/api/          # Personne 1: Logique BFF & API Externe
├── pages/              # Personne 2: Interface Utilisateur & Navigation
├── components/         # Personne 2: Composants UI Réutilisables
├── composables/        # Personne 3: Logique Métier & État
├── middleware/         # Personne 3: Authentification & Sécurité
├── supabase/           # Personne 3: Configuration Base de Données
└── types/              # Personne 3: Types TypeScript Partagés
```

### Personne 1: Backend-for-Frontend (BFF) & API Externe

**Responsabilités :**
- Implémentation des routes `/server/api/` pour communiquer avec Discogs
- Gestion des clés API et transformation des données
- Logique de caching et optimisation des requêtes
- Validation des données avec Zod

**Fichiers principaux :**
```
server/api/
├── discogs/
│   ├── search.get.ts      # Recherche de vinyles
│   ├── release/[id].get.ts # Détails d'une release
│   └── artist/[id].get.ts # Infos artiste
└── utils/
    └── discogs.ts          # Client Discogs configuré
```

### Personne 2: Interface Utilisateur & Navigation

**Responsabilités :**
- Création des pages et composants UI
- Intégration avec Nuxt UI et TailwindCSS
- Gestion de l'état local des formulaires
- Expérience utilisateur et responsive design

**Fichiers principaux :**
```
pages/
├── index.vue              # Page d'accueil/recherche
├── release/[id].vue       # Fiche détaillée vinyle
├── profile.vue            # Profil utilisateur
└── favorites.vue          # Favoris

components/
├── VinylCard.vue          # Carte vinyle
├── SearchForm.vue         # Formulaire recherche
└── FavoriteButton.vue     # Bouton favori
```

### Personne 3: Logique Métier & Données

**Responsabilités :**
- Configuration Supabase et schéma de base de données
- Logique d'authentification avec RLS (Row Level Security)
- Composables réutilisables (état, gestion des favoris)
- Types TypeScript partagés et validation

**Fichiers principaux :**
```
composables/
├── useAuth.ts            # Logique authentification
├── useFavorites.ts       # Gestion favoris
└── useSearch.ts          # Recherche et filtres

supabase/
├── migrations/           # Scripts migration DB
└── schema.sql           # Structure tables

middleware/
└── auth.ts              # Protection routes

types/
└── index.ts             # Types TypeScript partagés
```

### Workflow de Développement

#### Phase 1: Setup (Personne 3)
1. Configuration Supabase locale
2. Création des tables et politiques RLS
3. Définition des types TypeScript partagés
4. Setup du middleware d'authentification

#### Phase 2: Développement Parallèle
- **Personne 1**: Développe endpoints BFF avec mock data Discogs
- **Personne 2**: Crée les pages et composants avec données mockées
- **Personne 3**: Implémente la logique métier et l'intégration Supabase

#### Phase 3: Intégration
1. Connexion réelle à l'API Discogs (Personne 1)
2. Intégration des composants avec les données réelles (Personne 2)
3. Tests d'intégration et correction des bugs (tous)

### Communication et Coordination

**Réunions quotidiennes :**
- Sync de 15min pour aligner les interfaces
- Review des pull requests ensemble
- Partage des types et contrats API

**Git Workflow :**
- Branch `main` protégée
- Une branche par personne (`feature/bff`, `feature/frontend`, `feature/data`)
- Pull requests obligatoires avec review des 2 autres

**Documentation :**
- Contrats API documentés dans `/docs/api.md`
- Types partagés dans `/types/index.ts`
- README mis à jour avec l'avancement

Cette organisation permet un développement efficace sans conflits de fichiers, tout en exploitant les forces de chaque personne et l'architecture BFF de Nuxt.
