## Windows Prisma EPERM Fix (Local)

If you encounter EPERM or file lock errors (often on Windows) during Prisma migration or build, use these steps:

```bat
taskkill /F /IM node.exe
rd /s /q .next
rd /s /q node_modules\.prisma
npm run build:local
```

## Diagnose if `prisma migrate deploy` fails

```bash
npx prisma migrate status
npx prisma migrate deploy
```

- Always run `npm run build:local` for local dev (skips migrate deploy).
- Use `npm run build` for CI/Vercel (includes migrate deploy).
