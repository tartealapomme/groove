# Guide complet : Base de données Supabase pour GROOV

Ce guide t’explique **étape par étape** comment créer la base Supabase, le modèle de données, et intégrer tout dans ton projet GROOV.

HZvf9UjMhwXHMFhH

---

## Vue d’ensemble

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  auth.users     │     │  user_collection │     │  user_favorites │
│  (Supabase)     │────▶│  (ma collection) │     │  (wishlist)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                    user_id (UUID)
```

- **user_collection** : les vinyles que tu possèdes (ta bibliothèque)
- **user_favorites** : les vinyles que tu souhaites acheter (coups de cœur / wishlist)

---

## Étape 1 : Créer le projet Supabase (si pas déjà fait)

### 1.1 Créer un projet

1. Va sur [supabase.com](https://supabase.com) et connecte-toi
2. **New project** → choisis une organisation, un nom, un mot de passe pour la base
3. Attends la création du projet (quelques minutes)

### 1.2 Récupérer les clés

1. **Settings** → **API**
2. Note :
   - **Project URL** (ex. `https://xxxx.supabase.co`)
   - **anon public** (clé publique, utilisée côté client)
   - **service_role** (clé secrète, à ne jamais exposer côté client)

### 1.3 Configurer les variables d’environnement

Crée ou complète `.env` à la racine du projet :

```env
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_KEY=ta-cle-anon-publique
```

Pour Nuxt + `@nuxtjs/supabase`, ces noms sont reconnus automatiquement.

---

## Étape 2 : Créer les tables dans Supabase

### 2.1 Où exécuter le SQL

1. Dans le dashboard Supabase : **SQL Editor**
2. Clique sur **New query**
3. Colle le contenu du fichier `supabase/migrations/20250227000000_create_collection_favorites.sql`
4. Clique sur **Run** (ou Ctrl+Enter)

### 2.2 Ce que fait la migration

La migration crée :

1. **Table `user_collection`**  
   - Stocke les vinyles de ta bibliothèque  
   - Colonnes : `user_id`, `discogs_id`, `title`, `artist`, `year`, `label`, `genre`, `thumb`, `cover`, `condition`, `notes`, `created_at`  
   - Contrainte unique `(user_id, discogs_id)` pour éviter les doublons  

2. **Table `user_favorites`**  
   - Stocke les vinyles en wishlist  
   - Colonnes : `user_id`, `discogs_id`, `title`, `artist`, `thumb`, `cover`, `created_at`  
   - Contrainte unique `(user_id, discogs_id)`  

3. **Row Level Security (RLS)**  
   - Chaque utilisateur ne voit et ne modifie que ses propres lignes  
   - Politiques : SELECT, INSERT, UPDATE, DELETE basées sur `auth.uid()`  

### 2.3 Vérifier que tout est créé

- **Table Editor** → tu dois voir `user_collection` et `user_favorites`
- **Authentication** → **Policies** : les politiques RLS doivent être actives

---

## Étape 3 : Mettre à jour les types TypeScript

Le fichier `database.types.ts` contient les types générés pour Supabase. Il a été mis à jour avec les types pour `user_collection` et `user_favorites`.

Si tu modifies le schéma plus tard, tu peux régénérer les types avec la CLI :

```bash
npx supabase gen types typescript --project-id TON_PROJECT_ID > database.types.ts
```

(Ton Project ID est dans **Settings** → **General** → **Reference ID**)

---

## Étape 4 : Composables Nuxt

Deux composables ont été créés pour interagir avec la base :

### 4.1 `useUserCollection`

Gère la collection (bibliothèque) :

```ts
const { collection, fetchCollection, addToCollection, removeFromCollection, isInCollection } = useUserCollection()

// Charger la collection
await fetchCollection()

// Ajouter un vinyle
await addToCollection({
  discogs_id: 12345,
  title: 'Album Title',
  artist: 'Artist Name',
  year: '2024',
  label: 'Label',
  genre: ['Rock'],
  thumb: 'https://...',
  cover: 'https://...',
  condition: 'NM',
  notes: 'Ma note perso',
})

// Retirer un vinyle
await removeFromCollection(12345)

// Vérifier si un vinyle est en collection
const inCollection = isInCollection(12345)
```

### 4.2 `useUserFavorites`

Gère les coups de cœur (wishlist) :

```ts
const { favorites, fetchFavorites, addFavorite, removeFavorite, isFavorite } = useUserFavorites()

// Charger les favoris
await fetchFavorites()

// Ajouter un favori
await addFavorite({
  discogs_id: 12345,
  title: 'Album Title',
  artist: 'Artist Name',
  thumb: 'https://...',
  cover: 'https://...',
})

// Retirer un favori
await removeFavorite(12345)

// Vérifier si un vinyle est en favori
const inFav = isFavorite(12345)
```

---

## Étape 5 : Intégration dans le frontend

### 5.1 Page Bibliothèque (`/bibliotheque`)

- Remplacer l’appel Discogs mock par `useUserCollection`
- Afficher les vinyles de `collection`
- Si l’utilisateur n’est pas connecté → rediriger vers `/auth/login?redirect=/bibliotheque`
- Bouton « Retirer » qui appelle `removeFromCollection(discogs_id)`

### 5.2 Bouton « Ajouter à ma collection »

- Sur les cartes vinyle (explore, index, fiche vinyle)
- Vérifier `isInCollection(discogs_id)` pour afficher « Retirer » ou « Ajouter »

### 5.3 Bouton « Coup de cœur » (wishlist)

- Icône cœur sur les cartes et la fiche vinyle
- État rempli / vide selon `isFavorite(discogs_id)`
- Clic : `addFavorite` ou `removeFavorite`

### 5.4 Page ou section Wishlist

- Liste des vinyles en `user_favorites`
- Lien depuis le header (icône cœur) comme prévu dans le design

---

## Étape 6 : Bucket Storage (avatars)

Pour la photo de profil sur `/profil` :

1. **Storage** → **New bucket** → nom : `avatars`
2. **Public** : activé
3. Politique : permettre aux utilisateurs authentifiés d’uploader dans `{user_id}/`

---

## Ordre des opérations recommandé

1. Créer les tables + RLS dans Supabase (Étape 2)
2. Vérifier que `database.types.ts` est à jour (Étape 3)
3. Les composables sont déjà créés (Étape 4)
4. Intégrer dans le frontend (Étape 5)
5. Configurer le bucket Storage si besoin (Étape 6)

---

## Récapitulatif des fichiers créés/modifiés

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/20250227000000_create_collection_favorites.sql` | Création des tables et RLS |
| `database.types.ts` | Types TypeScript pour Supabase |
| `app/composables/useUserCollection.ts` | Composable collection |
| `app/composables/useUserFavorites.ts` | Composable favoris |

---

## Dépannage

### Erreur « RLS policy violation »
- Vérifie que l’utilisateur est bien connecté (`useSupabaseUser()`)
- Vérifie que les politiques RLS sont bien définies sur les deux tables

### Les données ne s’affichent pas
- Vérifie que `fetchCollection()` ou `fetchFavorites()` est bien appelé après le chargement de la page
- Ouvre la console du navigateur pour voir les erreurs

### Doublons
- La contrainte unique `(user_id, discogs_id)` empêche les doublons. Si tu essaies d’ajouter deux fois le même vinyle, Supabase renverra une erreur. Gère-la avec un `try/catch` ou `upsert` si tu veux mettre à jour au lieu d’insérer.
