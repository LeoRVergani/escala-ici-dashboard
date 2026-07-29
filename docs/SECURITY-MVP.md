# Security MVP

- Frontend nunca usa Firebase Admin.
- Escrita oficial fica no backend.
- `ALLOW_OFFICIAL_FIRESTORE_WRITE=false` por padrão.
- Service accounts, tokens e `.env` real não entram no Git.
- Login de desenvolvimento só é aceito em `NODE_ENV=development` e com `DEV_AUTH_ENABLED=true`.
- Backend valida RBAC em toda rota de equipe.
- Upload XLS/XLSX é processado em memória, com limite de tamanho, extensão e assinatura.
- Logs não registram tokens.
- Service worker ignora `/api/` e protocolos não HTTP/HTTPS.
