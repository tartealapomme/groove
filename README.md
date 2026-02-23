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

