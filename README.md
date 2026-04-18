# Cordia API

REST API backend for the Cordia analytics platform. Receives telemetry data from the Cordia SDKs (command usage, user activity, guild counts, heartbeats) and stores it in MongoDB.

## Stack

- **Runtime:** Node.js + Express 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Validation:** Zod

## Endpoints

All routes are prefixed with `/api/v1` and require an API key via the `Authorization: Bearer <key>` header.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/track-command` | Log a command execution event |
| POST | `/track-user` | Log an active user event |
| POST | `/guild-count` | Report current server count |
| POST | `/heartbeat` | Send an uptime ping |
| GET | `/health` | Health check (no auth required) |

Rate limited to 120 requests/minute per API key.

## Setup

```bash
# Install dependencies
npm install

# Create a .env file
cp .env.example .env
# Fill in MONGO_URI, PORT, etc.

# Run in development
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Server port (default: 5000) |

## Related

- [cordia](https://www.npmjs.com/package/cordia) — JavaScript/TypeScript SDK
- [cordia](https://pypi.org/project/cordia/) — Python SDK
- [Documentation](https://docs.cordialane.com)

## License

MIT
