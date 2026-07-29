import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { CATALOGO_SOC, LOGINS_SOC } from '../packages/contrato/src/index.ts';

const EQUIPE_ID = 'EQ_SOC';

const NOMES_SOC: Record<string, string> = {
  aleilima: 'Alei Lima',
  ivcarvalho: 'Iv Carvalho',
  alamancio: 'Alamancio',
  altaborda: 'Altaborda',
  lvergani: 'Leonardo Vergani',
  cestradioto: 'Cestradioto',
  thaisvribeiro: 'Thais V Ribeiro',
  dschlottag: 'D Schlottag',
  luizneto: 'Luiz Neto',
};

function carregarEnvLocal(): void {
  for (const nome of ['.env', '.env.local']) {
    const caminho = resolve(process.cwd(), nome);
    if (!existsSync(caminho)) continue;
    const linhas = readFileSync(caminho, 'utf8').split(/\r?\n/);
    for (const linha of linhas) {
      const limpa = linha.trim();
      if (!limpa || limpa.startsWith('#')) continue;
      const idx = limpa.indexOf('=');
      if (idx === -1) continue;
      const chave = limpa.slice(0, idx).trim();
      const valor = limpa.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[chave] ??= valor;
    }
  }
}

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`Variavel ${nome} nao configurada.`);
  return valor;
}

function firebaseConfig(): FirebaseOptions {
  return {
    apiKey: envObrigatoria('VITE_FIREBASE_API_KEY'),
    authDomain: envObrigatoria('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: envObrigatoria('VITE_FIREBASE_PROJECT_ID'),
    appId: envObrigatoria('VITE_FIREBASE_APP_ID'),
  };
}

function montarUsuarios(lverganiUid = LOGINS_SOC.lvergani) {
  return Object.entries(LOGINS_SOC).map(([login, uid]) => ({
    uid: login === 'lvergani' ? lverganiUid : uid,
    login,
    nome: NOMES_SOC[login] ?? login,
    equipeId: EQUIPE_ID,
    ativo: true,
    nivelHierarquico: login === 'lvergani' ? 4 : 20,
    permissoes: login === 'lvergani' ? ['ADMIN', 'DEVELOPER'] : [],
  }));
}

async function main(): Promise<void> {
  carregarEnvLocal();
  const dryRun = process.argv.includes('--dry-run');
  const usuarios = montarUsuarios();

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      equipeId: EQUIPE_ID,
      tiposTurno: Object.keys(CATALOGO_SOC).length,
      usuarios: usuarios.length,
      adminDev: usuarios.find((usuario) => usuario.login === 'lvergani'),
    }, null, 2));
    return;
  }

  const app = initializeApp(firebaseConfig());
  const auth = getAuth(app);
  const db = getFirestore(app);
  const credential = await signInWithEmailAndPassword(
    auth,
    envObrigatoria('SEED_FIREBASE_EMAIL'),
    envObrigatoria('SEED_FIREBASE_PASSWORD'),
  );
  const adminUid = credential.user.uid;
  const usuariosAutenticados = montarUsuarios(adminUid);
  const usuarioLvergani = usuariosAutenticados.find((usuario) => usuario.login === 'lvergani');
  if (!usuarioLvergani) throw new Error('Usuario lvergani ausente do seed.');
  const agora = serverTimestamp();

  await setDoc(doc(db, 'usuarios', adminUid), {
    ...usuarioLvergani,
    atualizadoEm: agora,
  }, { merge: true });

  const batch = writeBatch(db);

  batch.set(doc(db, 'config', 'app'), {
    schemaVersion: 1,
    app: 'escala-ici',
    modo: 'spark',
    atualizadoEm: agora,
  }, { merge: true });

  batch.set(doc(db, 'equipes', EQUIPE_ID), {
    nome: 'SOC - Escala 6',
    escala: '6x1',
    ativa: true,
    atualizadoEm: agora,
  }, { merge: true });

  for (const turno of Object.values(CATALOGO_SOC)) {
    batch.set(doc(db, 'tiposTurno', `${EQUIPE_ID}_${turno.codigo}`), {
      ...turno,
      equipeId: EQUIPE_ID,
      atualizadoEm: agora,
    }, { merge: true });
  }

  for (const usuario of usuariosAutenticados) {
    if (usuario.login === 'lvergani') continue;
    batch.set(doc(db, 'usuarios', usuario.uid), {
      ...usuario,
      atualizadoEm: agora,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`Seed Firebase Spark concluido: ${usuariosAutenticados.length} usuarios e ${Object.keys(CATALOGO_SOC).length} tiposTurno.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
