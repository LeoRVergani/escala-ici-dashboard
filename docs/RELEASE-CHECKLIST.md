# Release Checklist

- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run build:api`
- [ ] `npm run smoke:api`
- [ ] `npm run test:e2e`
- [ ] `git diff --check`
- [ ] `.env` real fora do Git
- [ ] `ALLOW_OFFICIAL_FIRESTORE_WRITE=false`
- [ ] Nenhuma tag criada sem autorização
- [ ] Nenhum deploy sem autorização
- [ ] Nenhuma escrita Firebase real sem autorização explícita
