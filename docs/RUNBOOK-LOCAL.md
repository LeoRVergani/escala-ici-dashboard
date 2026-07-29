# Runbook Local

1. Instale dependências: `npm install`.
2. Copie `.env.example` para `.env`.
3. Mantenha `ALLOW_OFFICIAL_FIRESTORE_WRITE=false`.
4. Inicie a API: `npm run dev:api`.
5. Inicie o frontend: `npm run dev:web`.
6. Acesse `http://localhost:5173`.
7. Use `Acessar ambiente de teste` para criar uma sessão de desenvolvimento.

Validação rápida:

```bash
npm run typecheck
npm run test
npm run build
npm run build:api
npm run smoke:api
```
