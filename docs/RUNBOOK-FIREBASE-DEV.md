# Runbook Firebase Dev

Use Firebase Emulator antes de qualquer escrita real.

```bash
npm run firebase:emulators
```

Configuração esperada:

- `FIREBASE_PROJECT_ID=escala-ici-dev`
- `OFFICIAL_WORKSPACE_ID=ici-dev`
- `DEMO_WORKSPACE_ID=demo-v1`
- `ALLOW_OFFICIAL_FIRESTORE_WRITE=false`

Credenciais reais devem ficar fora do repositório e ser apontadas por `GOOGLE_APPLICATION_CREDENTIALS`.
