# AudioStream : guide d'installation

## Ce qui change par rapport à la démo

| Avant | Maintenant |
|---|---|
| `<audio src="drive.google.com/uc?...">` (page de login HTML, jamais de l'audio) | `<audio src="/api/stream?id=...">` : le serveur lit Drive avec le token et relaie le flux |
| Pas de support `Range` (pas de seek, Safari refuse) | `Range` / `206 Partial Content` relayés |
| Token Google dans l'URL ou dans le navigateur, expire après 1h | Refresh token **chiffré en base**, access token renouvelé automatiquement côté serveur |
| Liste des dossiers = tout le Drive | Une **bibliothèque** = un dossier racine ; seuls les sous-dossiers contenant de l'audio sont indexés |
| Partage = bouton vide | Liens de partage par sous-dossier (écoute seule ou écoute + renommer, expiration, révocation) |

## 1. Google Cloud (une fois)

1. https://console.cloud.google.com → crée un projet.
2. **APIs & Services → Library** → active **Google Drive API**.
3. **OAuth consent screen** : type *External*, ajoute ton email dans *Test users*, ajoute le scope `.../auth/drive`.
4. **Credentials → Create credentials → OAuth client ID** → type *Web application*.
   - *Authorized redirect URI* : `https://<TON-PROJET>.supabase.co/auth/v1/callback`
5. Note le **Client ID** et le **Client secret**.

> ⚠️ Tant que l'écran de consentement est en mode **Testing**, Google révoque les refresh tokens après **7 jours** : il faudra recliquer sur « Reconnecter Google Drive ». Pour que ça tienne, passe l'app en **In production** (pour un usage perso, tu verras juste un avertissement « app non vérifiée » à valider une fois).

## 2. Supabase

1. **SQL Editor** → colle le contenu de `supabase/schema.sql` → Run.
2. **Authentication → Providers → Google** : active, colle le Client ID et le Client secret.
3. **Authentication → URL Configuration** :
   - Site URL : `http://localhost:3000`
   - Redirect URLs : `http://localhost:3000/**` (ajoute plus tard ton domaine de prod)
4. **Project Settings → API** : récupère `URL`, la clé `anon` et la clé `service_role`.

## 3. Variables d'environnement

```bash
cp .env.example .env
openssl rand -base64 32     # → colle le résultat dans NUXT_ENCRYPTION_KEY
```

Remplis ensuite `.env` (toutes les clés sont expliquées dans `.env.example`).
La clé `SUPABASE_SERVICE_KEY` ne doit **jamais** être publique ni commitée.

## 4. Lancer

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000 → *Connexion Google* → accepte l'accès au Drive → *Choisir un dossier* → l'indexation démarre.

## 5. Utilisation

- **Bibliothèque** : le dossier racine que tu choisis. Le bouton ↻ réindexe si tu as ajouté des fichiers directement dans Drive.
- **Partager** : survole un dossier dans la colonne de gauche → icône partage → crée un lien. L'invité ouvre `/s/<token>` sans compte et ne voit que ce dossier et ses sous-dossiers.
- **Supprimer** : met le fichier à la **corbeille Drive** (récupérable), pas de suppression définitive.
- **Retirer une bibliothèque** : supprime l'index et les liens de partage, ton Drive n'est pas touché.

## Sécurité en bref

- Le token Google ne sort jamais du serveur.
- Les tables Supabase n'ont aucune policy RLS : seul le serveur (service_role) y accède.
- Un invité ne peut lire/renommer que des fichiers dont le chemin passe par le dossier partagé (contrôle serveur à chaque requête de stream).
- Les liens non expirants restent valides jusqu'à révocation : mets une expiration pour les partages sensibles.

## Limites connues / pistes

- L'indexation est manuelle (bouton ↻). Une indexation planifiée ou via les webhooks Drive est possible plus tard.
- Pour un Drive de plusieurs dizaines de milliers de fichiers, l'indexation tourne dans une requête HTTP : prévoir une tâche en arrière-plan.
- Le streaming passe par ton serveur : la bande passante de l'hébergeur est consommée à chaque écoute.
