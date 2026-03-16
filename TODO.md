# TODO — GROOV

## Priorités

### 1. Icône Wishlist dans le header (utilisateur connecté)
- [ ] Ajouter une icône cœur cliquable dans `AppHeader` visible uniquement quand l'utilisateur est connecté
- [ ] Au clic : afficher un dropdown ou une slide-out avec la liste des vinyles de la wishlist
- [ ] Permettre d'ajouter un vinyle à la wishlist via le bouton cœur sur les cartes / page vinyl
- [ ] Persister la wishlist (Supabase ou localStorage selon l'architecture)

### 2. Page profil utilisateur
- [ ] Créer une route `/profil` (ou `/compte`) accessible aux utilisateurs connectés
- [ ] Afficher : avatar, email, préférences (genres/artistes de l'onboarding)
- [ ] Permettre de modifier les préférences, le pseudo, la photo de profil
- [ ] Lien vers la bibliothèque, la wishlist, l'historique des alertes
- [ ] Redirection vers login si non connecté

### 3. Rewind plus dynamique et impactant
- [x] Remplacer les transitions CSS basiques par des animations plus marquées (scale, blur, parallax)
- [x] Ajouter des effets de typographie (compteurs animés, reveal letter-by-letter)
- [x] Fond plus immersif : gradients animés, particules légères, scan lines
- [x] Micro-interactions sur les éléments (hover, focus)
- [ ] Musique ou son ambiant optionnel
- [x] Partager le Rewind (export image, lien social)

---

## Idées innovantes

### Marketplace & UX
- [ ] **Alertes prix** : notifier l'utilisateur quand un vinyle de sa wishlist descend sous un seuil
- [ ] **Comparateur de prix** : afficher l'évolution du prix sur 6 mois — ❌ **données indisponibles** : l'API Discogs ne fournit que le prix le plus bas actuel (`/marketplace/stats`) et les price suggestions par état, pas d'historique temporel ; le sales history (30 ventes) n'est pas exposé via l'API
- [ ] **Mode "chasse"** : carte interactive des vinyles en vente près de chez soi (géoloc + annonces)
- [x] **Identifier un vinyle** : recherche manuelle + OCR optionnel (imprécis sur pochettes artistiques) ; astuce CoverLens pour reconnaissance par image ✓

### Social & Découverte
- [ ] **Profil public** : partager sa collection / wishlist avec un lien unique
- [ ] **Recommandations sociales** : "Les utilisateurs qui ont X ont aussi aimé Y"
- [ ] **Feed d'activité** : "Marie a ajouté [Vinyle] à sa collection"
- [ ] **Clubs / cercles** : groupes privés autour d'un genre ou d'un artiste

### Gamification & Engagement
- [ ] **Badges** : "Premier vinyle", "10 pays", "Collectionneur 70s", etc.
- [ ] **Défis** : "Ajoute 5 vinyles de jazz ce mois-ci"
- [ ] **Classement** : top collectionneurs par genre ou par rareté
- [ ] **Streak** : récompenser la connexion régulière

### Technique & Perf
- [ ] **PWA** : installer l'app, mode offline pour la bibliothèque locale
- [ ] **Export collection** : CSV / PDF de sa collection pour assurance ou revente
- [ ] **Import Discogs** : synchroniser sa collection Discogs existante
- [ ] **Dark / Light mode** : toggle selon le design system

### Design & Identité
- [ ] **Thème vinyle** : variantes de couleurs (noir/blanc actuel + "vintage" sepia, "neon" accent)
- [ ] **Animations de chargement** : spinner simple (skeletons retirés — trop gourmands)
- [ ] **Easter eggs** : interactions cachées (ex. clic long sur le logo)

---

## Côté utilisateur — "Ce qui ferait plaisir"

### Gain de temps
- [ ] **Recherche dans ma collection** : filtrer/trouver un vinyle sans scroller
- [ ] **Historique des vues** : "Récemment consultés" pour retrouver ce qu'on a regardé
- [ ] **Lien de partage** : copier le lien d'une fiche vinyle en un clic (ex. pour envoyer à un pote)
- [ ] **Notes perso** : ajouter une note sur un vinyle ("acheté 12€", "à offrir à…")

### Découverte
- [ ] **"Plus comme ça"** : à partir d'un vinyle, proposer des similaires (même label, même année, même genre)
- [ ] **Découverte du jour** : un vinyle mis en avant chaque jour (rare, coup de cœur, réédition)
- [ ] **Sorties récentes** : filtre "paru ce mois" pour les rééditions / nouveaux pressages

### Confiance & achat
- [ ] **Indicateur "bonne affaire"** : comparer le prix actuel aux suggestions par état (vert si sous la fourchette)
- [ ] **Rappel "en stock"** : alerte quand un vinyle de la wishlist revient en vente (s'il n'y en avait plus)

### Fierté & partage
- [ ] **"Ma pièce rare"** : mettre en avant 1–3 vinyles dans sa collection (badge, section dédiée)
- [ ] **Partage Rewind** : générer une image ou un lien à partager sur les réseaux
