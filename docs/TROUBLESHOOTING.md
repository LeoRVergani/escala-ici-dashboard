# Troubleshooting

## Vitest ou Vite falha com `node:util styleText`

Use Node `24.14.1` ou superior neste projeto.

```bash
nvm use 24.14.1
npm install
```

## Backend offline no frontend

Confirme:

- `npm run dev:api`
- `VITE_API_BASE_URL=http://127.0.0.1:3001`
- `CORS_ORIGINS=http://localhost:5173`

## XLS rejeitado

O backend valida extensão e assinatura. Renomear arquivo inválido para `.xlsx` não passa.
