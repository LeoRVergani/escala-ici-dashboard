# Dashboard Escala ICI

Dashboard profissional para gestão de escalas ICI com React, TypeScript, Vite, backend Express e contrato preparado para publicação revisionada compatível com o app KMP.

## Estado Atual

- Frontend Órbita dark-only.
- Backend Express modular em `server/`.
- Login de desenvolvimento e RBAC por equipe.
- Preview XLS/XLSX em memória, sem persistir arquivo bruto.
- Draft/autosave via API.
- Validação 6x1/descanso/plantão no backend.
- Publicação revisionada com flag oficial desligada por padrão.
- Leitura ativa, histórico, exportação XLSX, trocas, admin, auditoria e outbox em MVP local.

## Setup Local

```bash
npm install
copy .env.example .env
npm run dev:api
npm run dev:web
```

Frontend: `http://localhost:5173`

API: `http://127.0.0.1:3001/api/health`

## Scripts

```bash
npm run typecheck
npm run test
npm run build
npm run build:api
npm run seed:firebase-spark -- --dry-run
npm run seed:firebase-spark
npm run smoke:api
npm run test:e2e
```

## Firebase

Base Spark preparada em `firebase.json`, `firestore.rules` e `firestore.indexes.json`.

O seed `npm run seed:firebase-spark` usa somente o Firebase Web SDK, carrega variaveis `VITE_FIREBASE_*` do ambiente ou `.env`, autentica com `SEED_FIREBASE_EMAIL`/`SEED_FIREBASE_PASSWORD`, cria `config/app`, `equipes/EQ_SOC`, os `tiposTurno` do contrato e 9 documentos em `usuarios`. Para teste, `lvergani` fica salvo como usuario ativo com `permissoes: ["ADMIN", "DEVELOPER"]` e `nivelHierarquico: 4`.

Para o primeiro uso em projeto vazio, crie a conta Auth do `lvergani` e rode o seed autenticado nela; as regras permitem apenas esse bootstrap do proprio documento admin/dev. Em producao, alinhe os IDs dos documentos `usuarios/{uid}` aos UIDs reais do Firebase Auth/Microsoft antes de publicar escalas.

Nunca coloque service account dentro de `src`, `public` ou Git. Use `GOOGLE_APPLICATION_CREDENTIALS` apontando para um caminho absoluto fora do repositório.

`ALLOW_OFFICIAL_FIRESTORE_WRITE=false` é o padrão obrigatório. A publicação real controlada só deve ocorrer após autorização explícita.

## Documentação

- `docs/RUNBOOK-LOCAL.md`
- `docs/RUNBOOK-FIREBASE-DEV.md`
- `docs/RUNBOOK-PUBLICATION.md`
- `docs/TROUBLESHOOTING.md`
- `docs/SECURITY-MVP.md`
- `docs/RELEASE-CHECKLIST.md`
- `docs/spec/04-MVP-FIREBASE-KMP-CONTRACT.md`
