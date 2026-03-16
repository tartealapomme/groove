# Guide : Setup Supabase — Collection & Coups de cœur par utilisateur

Ce document décrit toutes les étapes à suivre (ou à me demander d’implémenter) pour avoir une **vraie base Supabase** avec :
- une **collection** de vinyles par utilisateur
- des **coups de cœur** (wishlist) par utilisateur

---

## Vue d’ensemble

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  auth.users     │     │  user_collection  │     │  user_favorites  │
│  (Supabase)     │────▶│  (mes vinyles)    │     │  (wishlist)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                         │                         │
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                    user_id (UUID)
```

---

## Étape 1 : Créer / configurer le projet Supabase

### 1.1 Projet Supabase

1. Va sur [supabase.com](https://supabase.com) et connecte-toi
2. Crée un projet (ou utilise celui existant)
3. Récupère dans **Settings → API** :
   - **Project URL** (ex. `https://xxxx.supabase.co`)
   - **anon public** (clé publique)
   - **service_role** (clé secrète, à ne jamais exposer côté client)

### 1.2 Variables d’environnement

Crée ou complète `.env` à la racine du projet :

```env
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_KEY=ta-cle-anon-publique
```

Pour Nuxt + `@nuxtjs/supabase`, ces noms sont reconnus automatiquement.

### 1.3 Storage (photo de profil)

La page `/profil` permet de changer sa photo. Crée un bucket **avatars** dans Supabase :

1. **Storage** → **New bucket** → nom : `avatars`
2. **Public** : activé
3. Politique : permettre aux utilisateurs authentifiés d’uploader dans `{user_id}/`

---

## Étape 2 : Schéma de la base de données

### 2.1 Tables à créer

Tu peux me demander de te générer les migrations SQL. Voici le schéma cible :

#### Table `user_collection`

Stocke les vinyles ajoutés à la collection d’un utilisateur.

| Colonne       | Type         | Contraintes                    |
|---------------|--------------|--------------------------------|
| id            | uuid         | PK, default `gen_random_uuid()`|
| user_id       | uuid         | FK → auth.users, NOT NULL      |
| discogs_id    | integer      | NOT NULL (ID Discogs)          |
| title         | text         |                                |
| artist        | text         |                                |
| year          | text         |                                |
| label         | text         |                                |
| genre         | text[]       |                                |
| thumb         | text         |                                |
| cover         | text         |                                |
| condition     | text         | NM, VG+, etc.                  |
| notes         | text         | Notes perso                    |
| created_at    | timestamptz  | default `now()`                |

**Contrainte unique** : `(user_id, discogs_id)` pour éviter les doublons.

#### Table `user_favorites`

Stocke les vinyles en wishlist (coups de cœur).

| Colonne       | Type         | Contraintes                    |
|---------------|--------------|--------------------------------|
| id            | uuid         | PK, default `gen_random_uuid()`|
| user_id       | uuid         | FK → auth.users, NOT NULL      |
| discogs_id    | integer      | NOT NULL                       |
| title         | text         |                                |
| artist        | text         |                                |
| thumb         | text         |                                |
| cover         | text         |                                |
| created_at    | timestamptz  | default `now()`                |

**Contrainte unique** : `(user_id, discogs_id)`.

### 2.2 SQL de création (à exécuter dans l’éditeur SQL Supabase)

Tu peux me dire : *« Génère-moi le SQL pour créer les tables `user_collection` et `user_favorites` avec les bonnes colonnes »* et je te fournirai le script complet.

---

## Étape 3 : Row Level Security (RLS)

Chaque table doit avoir des politiques RLS pour que :
- un utilisateur ne voie que **ses** lignes
- un utilisateur ne puisse modifier que **ses** lignes

### 3.1 Politiques à définir

Pour `user_collection` et `user_favorites` :

| Action   | Politique                                      |
|----------|------------------------------------------------|
| SELECT   | `user_id = auth.uid()`                         |
| INSERT   | `user_id = auth.uid()`                         |
| UPDATE   | `user_id = auth.uid()`                         |
| DELETE   | `user_id = auth.uid()`                         |

Tu peux me demander : *« Génère les politiques RLS pour `user_collection` et `user_favorites` »*.

---

## Étape 4 : Mise à jour des types TypeScript

### 4.1 Fichier `database.types.ts`

Une fois les tables créées, il faut mettre à jour `database.types.ts` avec les types générés.

Tu peux me dire : *« Mets à jour `database.types.ts` avec les types pour `user_collection` et `user_favorites` »*.

Ou utiliser la CLI Supabase :

```bash
npx supabase gen types typescript --project-id TON_PROJECT_ID > database.types.ts
```

---

## Étape 5 : Composables côté Nuxt

### 5.1 `useUserCollection`

Composable pour gérer la collection :

- `fetchCollection()` : récupère les vinyles de l’utilisateur
- `addToCollection(vinyl)` : ajoute un vinyle
- `removeFromCollection(discogsId)` : retire un vinyle
- `collection` : ref réactive avec la liste

### 5.2 `useUserFavorites`

Composable pour les coups de cœur :

- `fetchFavorites()` : récupère la wishlist
- `addFavorite(vinyl)` : ajoute un coup de cœur
- `removeFavorite(discogsId)` : retire un coup de cœur
- `isFavorite(discogsId)` : indique si un vinyle est en favori
- `favorites` : ref réactive avec la liste

Tu peux me demander : *« Crée les composables `useUserCollection` et `useUserFavorites` »*.

---

## Étape 6 : Intégration frontend

### 6.1 Page Bibliothèque (`/bibliotheque`)

- Remplacer les données mock (Discogs « want ») par les vinyles de `user_collection`
- Afficher un message si l’utilisateur n’est pas connecté
- Bouton « Retirer » qui appelle `removeFromCollection`

### 6.2 Bouton « Ajouter à ma collection »

- Sur les cartes vinyle (explore, fiche vinyle)
- Vérifier si déjà en collection avant d’afficher « Retirer » ou « Ajouter »

### 6.3 Bouton « Coup de cœur » (wishlist)

- Icône cœur sur les cartes et la fiche vinyle
- État rempli / vide selon `isFavorite(discogsId)`
- Clic : `addFavorite` ou `removeFavorite`

### 6.4 Page ou section Wishlist

- Liste des vinyles en `user_favorites`
- Lien depuis le header (icône cœur) comme prévu dans le TODO

Tu peux me demander : *« Intègre la collection et les favoris dans la bibliothèque, les cartes et la fiche vinyle »*.

---

## Étape 7 : Sync optionnelle avec Discogs

Si tu veux pré-remplir la collection à partir des données Discogs (artiste, titre, pochette, etc.) :

- Lors de l’ajout, on envoie les infos du vinyle (discogs_id, title, artist, cover, etc.)
- On les stocke dans `user_collection` ou `user_favorites`
- Pas besoin de refaire un appel Discogs pour afficher la liste

---

## Récapitulatif des demandes possibles

| # | Demande à formuler | Ce que je ferai |
|---|--------------------|-----------------|
| 1 | « Génère le SQL pour créer les tables `user_collection` et `user_favorites` » | Script SQL complet avec contraintes |
| 2 | « Génère les politiques RLS pour ces tables » | Script SQL des politiques |
| 3 | « Mets à jour `database.types.ts` pour la collection et les favoris » | Types TypeScript |
| 4 | « Crée les composables `useUserCollection` et `useUserFavorites` » | Fichiers dans `composables/` |
| 5 | « Intègre la collection dans la page bibliothèque » | Remplacement des mocks par Supabase |
| 6 | « Ajoute les boutons collection et favoris sur les cartes et la fiche vinyle » | Composants + logique |
| 7 | « Ajoute l’icône wishlist dans le header avec dropdown » | Composant header + liste favoris |

---

## Ordre recommandé

1. Créer les tables + RLS dans Supabase (Étapes 1–3)
2. Mettre à jour `database.types.ts` (Étape 4)
3. Créer les composables (Étape 5)
4. Intégrer dans le frontend (Étape 6)

Tu peux me demander ces étapes une par une ou plusieurs d’un coup.
