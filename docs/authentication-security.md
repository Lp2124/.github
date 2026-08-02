# Authentication security operations

Password-reset requests always return the same accepted response after a minimum response window. SMTP delivery runs after the database transaction, so no database transaction remains open during network I/O. A delivery failure revokes that reset record without exposing the token or SMTP error to the HTTP client. Delivery is intentionally **best effort**, not guaranteed: users request a new reset if delivery fails, and every new request atomically revokes older pending reset tokens.

`TRUST_PROXY_HOPS` must equal the exact number of trusted reverse proxies in front of the API. Keep it at `0` when clients connect directly. The application never enables Express's ambiguous boolean `trust proxy` mode, so an untrusted client cannot select its limiter identity through `X-Forwarded-For`.

Production deployments apply versioned migrations with `npm run prisma:migrate:deploy`; they must never run `prisma migrate dev`.
