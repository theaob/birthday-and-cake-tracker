# Birthday & Cake Tracker

Track people's birthdays on a calendar and make sure a cake gets organised
for each one. Optionally sends a daily Zulip reminder for birthdays that
fall on the current day.

## Security model

The whole app requires signing in via Keycloak (OIDC) — every page and
every `/api/*` route is gated by `src/proxy.ts`, except `/api/cron`, which
is called server-to-server by an external scheduler and is protected by
its own `CRON_SECRET` bearer token instead of a browser session.

It's still built to run on a trusted deployment (your own server, behind
your own reverse proxy) rather than assuming internet-facing hardening —
`trustHost: true` is set in `src/auth.ts` so Auth.js trusts the Host
header when self-hosted (not on Vercel).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | No | SQLite connection string. Defaults to `file:./dev.db` locally; the Docker image sets it to a mounted volume path. |
| `AUTH_SECRET` | **Yes** | Secret used by Auth.js to sign session JWTs. Generate one with `npx auth secret`. |
| `AUTH_KEYCLOAK_ID` | **Yes** | Client ID of the OIDC client registered in your Keycloak realm. |
| `AUTH_KEYCLOAK_ISSUER` | **Yes** | Issuer URL, e.g. `https://keycloak.example.com/realms/<realm>`. |
| `CRON_SECRET` | No | If set, `/api/cron` requires `Authorization: Bearer <CRON_SECRET>`. Recommended if the cron endpoint is reachable from outside. |
| `ZULIP_SITE_URL`, `ZULIP_BOT_EMAIL`, `ZULIP_API_KEY`, `ZULIP_STREAM`, `ZULIP_TOPIC` | No | Fallback Zulip config used by `/api/cron` if nothing has been saved yet in the Settings panel (which is stored in the database and takes priority). |
| `NODE_EXTRA_CA_CERTS` | No | Path to a PEM file of extra trusted CA certificates. Set this if your Keycloak and/or Zulip server use a self-signed certificate — see below. |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | Set to `0` to disable TLS certificate verification for **all** outbound HTTPS requests the app makes. Only for closed-network deployments with no untrusted actors on the network — see below. |

### Setting up the Keycloak client

This app authenticates as a **public** client — no client secret is
configured or required, since the app uses PKCE (enabled by default by
Auth.js) to secure the login instead.

In your Keycloak admin console, create an OIDC client for this app with:

- **Client authentication**: Off (this is what makes it a public client)
- **Standard flow**: enabled
- **Valid redirect URI**:
  ```
  https://<your-app-domain>/api/auth/callback/keycloak
  ```

Use the client ID and your realm's issuer URL (`<keycloak-base-url>/realms/<realm-name>`) for the `AUTH_KEYCLOAK_*` variables above.

### Setting up the Zulip bot

In Zulip, go to **Personal settings → Bots** and create a new **Generic bot**
(an incoming-webhook bot also works). Note its email and API key, and enter
them in the app's Settings panel along with your Zulip site URL and the
stream/topic to post reminders to.

### Self-signed certificates (Keycloak / Zulip)

If your Keycloak and/or Zulip server present a self-signed certificate,
there are two ways to make the app trust it — pick based on your
deployment.

**Recommended: trust the specific certificate(s)**, via
[`NODE_EXTRA_CA_CERTS`](https://nodejs.org/api/cli.html#node_extra_ca_certsfile).
This is honored by both the Keycloak OIDC client and the Zulip API call in
`/api/cron`, since both go through Node's built-in `fetch`, and it doesn't
change how the app treats any other HTTPS connection.

1. Get the self-signed certificate (or the CA that issued it) as a PEM
   file for each service. If you have both, concatenate them into one
   bundle — Node reads every certificate in the file:
   ```bash
   cat keycloak-cert.pem zulip-cert.pem > ca-bundle.pem
   ```
2. Make that file available to the app and point `NODE_EXTRA_CA_CERTS` at
   it — for `npm run dev`, export it in your shell or `.env`; in Docker,
   mount it into the image's `/app/certs` mount point (see below).

**Alternative for closed networks: `NODE_TLS_REJECT_UNAUTHORIZED=0`.**
This disables certificate verification for *every* outbound HTTPS request
the app makes (not just Keycloak/Zulip) — there's no way to scope it to
one host, since it's a process-wide Node.js setting. Only use it when the
app runs on a closed network with no untrusted actors able to
man-in-the-middle that traffic (no separate certificate handling needed;
just set the env var, nothing to mount).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
Keycloak to sign in, so `AUTH_SECRET`/`AUTH_KEYCLOAK_*` need to be set even
locally (a `.env` file works fine — see `prisma.config.ts`).

Locally, Prisma reads/writes a `dev.db` SQLite file (gitignored — never
commit real data). Apply migrations with:

```bash
npx prisma migrate dev
```

## Birthday reminder cron

`/api/cron` checks for birthdays today and, if Zulip is configured and
enabled, posts a reminder message to the configured stream/topic. Trigger
it daily with whatever scheduler you have available — GitHub Actions,
`cron` + `trigger-cron.js`, etc. Protect it with `CRON_SECRET` if it's
reachable from outside your network.

## Docker

The image is built with `output: 'standalone'` and does **not** ship a
database — the SQLite file lives on a volume you mount, and pending Prisma
migrations are applied automatically on container start.

```bash
docker run -d \
  -p 3000:3000 \
  -v birthday-tracker-data:/app/data \
  -e AUTH_SECRET=... \
  -e AUTH_KEYCLOAK_ID=... \
  -e AUTH_KEYCLOAK_ISSUER=https://keycloak.example.com/realms/your-realm \
  ghcr.io/<owner>/birthday-and-cake-tracker:latest
```

`DATABASE_URL` defaults to `file:/app/data/prod.db` inside the container;
override it if you want a different path or filename. To upgrade, just
pull a new image and restart the container against the same volume — the
entrypoint runs `prisma migrate deploy` before starting the server.

If Keycloak or Zulip use self-signed certificates, also mount your CA
bundle into `/app/certs` (created for this purpose) and point
`NODE_EXTRA_CA_CERTS` at it (or, on a closed network only, set
`NODE_TLS_REJECT_UNAUTHORIZED=0` instead — see above):

```bash
  -v ./ca-bundle.pem:/app/certs/ca-bundle.pem:ro \
  -e NODE_EXTRA_CA_CERTS=/app/certs/ca-bundle.pem \
```

## Learn more

Built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io)
(SQLite via `@prisma/adapter-libsql`), [Auth.js](https://authjs.dev)
(Keycloak provider), and [date-fns](https://date-fns.org).
