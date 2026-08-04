# Welcome to John Boctor Services!

From this app you can do many things such as:
 * Request movies, shows, or books!
 * Fulfill those movies, shows, or books as an admin!
 * That is it... for now!

## Getting Started (Development)

The app runs in Docker alongside Postgres and Redis.

1. **Create your env file** (values in the example are already Compose-ready):

   ```bash
   cp .env.example .env
   ```

   For anything beyond local tinkering, set `SESSION_SECRET` and `PASSWORD_PEPPER`
   to your own random values.

2. **Start everything:**

   ```bash
   docker compose up --build
   ```

3. **Create the database tables** (first run only — the schema is applied with
   Drizzle push, not migration files):

   ```bash
   docker exec app npm run db:push
   ```

4. **Create an admin user** (passwords must be at least 16 characters):

   ```bash
   docker exec app npm run create-admin -- admin 'change-me-16-chars+'
   ```

Then open <http://localhost:3000> and sign in. There is no seeded user — the
database starts empty, so this step creates your first login.

## Managing users

The database starts with no users; manage them with the CLI:

```bash
docker exec app npm run cli -- list                        # list all users
docker exec app npm run cli -- create <username> <password> [--admin]
docker exec app npm run create-admin -- <username> <password>   # shortcut for create with --admin
docker exec app npm run cli -- make-admin <username>       # promote an existing user
docker exec app npm run cli -- delete <username>           # soft-delete a user
```

Admins can also edit usernames from the **Users** tab in the app.

## OAuth single sign-on

Once signed in as an admin, open the **OAuth** tab (`/admin/oauth`) to configure
an OAuth 2.0 / OpenID Connect provider (Google, GitHub, Okta, Azure AD, Auth0,
etc.). Register the redirect URI shown on that page with your provider. When
enabled, a "Sign in with &lt;provider&gt;" button appears on the login page.
