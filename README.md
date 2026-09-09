# Birthday & Cake Tracker

Track people's birthdays on a calendar and make sure a cake gets organised
for each one. Optionally sends a daily email reminder for birthdays that
fall on the current day.

## Security model

This app has **no login** — anyone who can reach it can add, edit, or
delete birthdays. It's built to run on a trusted network (home server,
private LAN, behind a VPN) rather than be exposed directly to the public
internet. The Email Settings panel is the one part that can be locked with
an admin password (see `ADMIN_PASSWORD` below); everything else is open by
design.

If you need to expose this publicly, put it behind a reverse proxy with
its own authentication (e.g. Caddy/Traefik + basic auth, Authelia,
Tailscale/Cloudflare Access) rather than relying on the app itself.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | No | SQLite connection string. Defaults to `file:./dev.db` locally; the Docker image sets it to a mounted volume path. |
| `ADMIN_PASSWORD` | No | If set, the Email Settings panel requires this password (sent as the `x-admin-password` header) to view or change SMTP config. If unset, settings are open. |
| `CRON_SECRET` | No | If set, `/api/cron` requires `Authorization: Bearer <CRON_SECRET>`. Recommended if the cron endpoint is reachable from outside. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_EMAIL` | No | Fallback SMTP config used by `/api/cron` if nothing has been saved yet in the Email Settings panel (which is stored in the database and takes priority). |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Locally, Prisma reads/writes a `dev.db` SQLite file (gitignored — never
commit real data). Apply migrations with:

```bash
npx prisma migrate dev
```

## Birthday reminder cron

`/api/cron` checks for birthdays today and, if email is configured and
enabled, sends a reminder. Trigger it daily with whatever scheduler you
have available — Vercel Cron, GitHub Actions, `cron` + `trigger-cron.js`,
etc. Protect it with `CRON_SECRET` if it's reachable from outside your
network.

## Docker

The image is built with `output: 'standalone'` and does **not** ship a
database — the SQLite file lives on a volume you mount, and pending Prisma
migrations are applied automatically on container start.

```bash
docker run -d \
  -p 3000:3000 \
  -v birthday-tracker-data:/app/data \
  -e ADMIN_PASSWORD=changeme \
  ghcr.io/<owner>/birthday-and-cake-tracker:latest
```

`DATABASE_URL` defaults to `file:/app/data/prod.db` inside the container;
override it if you want a different path or filename. To upgrade, just
pull a new image and restart the container against the same volume — the
entrypoint runs `prisma migrate deploy` before starting the server.

## Learn more

Built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io)
(SQLite via `@prisma/adapter-libsql`), and [date-fns](https://date-fns.org).
