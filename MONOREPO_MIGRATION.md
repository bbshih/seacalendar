# Monorepo Migration Plan

This document tracks the migration from single-app to monorepo architecture.

## Structure

```
seacalendar/
├── packages/
│   ├── shared/              # Shared TypeScript utilities and types
│   ├── database/            # Prisma schema and migrations
│   ├── api/                 # Express REST API
│   ├── discord-bot/         # Discord bot
│   └── web/                 # React app (existing code moved here)
├── scripts/
│   ├── watch-claude.js      # Branch watcher
│   └── dev-setup.js         # Development environment setup
├── docker-compose.dev.yml   # Local PostgreSQL
├── package.json             # Root workspace config
└── .env.development         # Local dev environment variables
```

## Migration Steps

- [x] Document migration plan
- [ ] Create monorepo root package.json
- [ ] Create packages directory structure
- [ ] Create packages/shared (types, utilities)
- [ ] Create packages/database (Prisma schema)
- [ ] Move existing code to packages/web
- [ ] Create packages/api (Express server)
- [ ] Create packages/discord-bot
- [ ] Set up development scripts
- [ ] Create branch watcher
- [ ] Create Docker Compose for local dev
- [ ] Update documentation

## Testing Checklist

After migration:
- [ ] `npm install` works
- [ ] `npm run dev` starts all services
- [ ] Web app runs at localhost:5173
- [ ] API runs at localhost:3001
- [ ] PostgreSQL accessible at localhost:5432
- [ ] Tests still pass
- [ ] Branch watcher detects changes
