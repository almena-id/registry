# almena-registry

The web portal of the Almena Network registry, built with [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript and Tailwind CSS 4. Its data comes from [api](../api).

## Quick start

Needs Node.js 24 or later, [Task](https://taskfile.dev) and Docker.

```bash
task init   # .env from .env.example
task dev    # the portal with hot reload on http://localhost:3000
```

The portal is published at `https://registry.almena.id` and uses the API at `https://api.almena.id`; to work against a local API instead (`task dev` in `../api`), point both API variables below at `http://localhost:8000`. To run the production build in Docker instead:

```bash
task up      # builds the image and starts it
task health  # {"status":"ok"}
```

## Configuration

Read from the environment or `.env`; [.env.example](.env.example) explains every one.

| Variable | Default | |
|---|---|---|
| `NEXT_PUBLIC_REGISTRY_WEB_URL` | `https://registry.almena.id` | Public origin of the portal, for metadata; inlined at build time |
| `NEXT_PUBLIC_REGISTRY_API_URL` | `https://api.almena.id` | The API as the browser reaches it; inlined into the bundle at build time, so changing it needs a rebuild |
| `REGISTRY_API_URL` | `https://api.almena.id` | The API as the Next.js server reaches it, read at runtime |
| `REGISTRY_WEB_PORT` | `3000` | Port of the portal on the host |

## Endpoints

| | |
|---|---|
| `GET /` | The portal |
| `GET /health` | Liveness, used by the Docker health check |

## Development

`task --list` shows every task. Before sending a change, `task check` (ESLint, TypeScript and a production build) must pass; see [CONTRIBUTING.md](CONTRIBUTING.md). This Next.js version differs from older ones: [AGENTS.md](AGENTS.md) points to the documentation bundled in `node_modules/next/dist/docs/`.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
