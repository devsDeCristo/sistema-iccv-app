import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * O endereço da API (o mesmo backend do painel web). No celular físico,
 * `localhost` é o próprio celular: use o IP da máquina na rede
 * (`EXPO_PUBLIC_API_URL=http://192.168.0.10:5000`).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

let token: string | null = null;
let aoExpirar: ((bloqueada: boolean) => void) | null = null;

/** Quem guarda a sessão avisa o token atual; as chamadas leem daqui */
export const definirToken = (novo: string | null) => {
  token = novo;
};

/** Chamado quando a API responde 401 com a sessão aberta */
export const aoSessaoExpirar = (fn: (bloqueada: boolean) => void) => {
  aoExpirar = fn;
};

export class ErroDaApi extends Error {
  constructor(
    public status: number,
    message: string,
    public corpo: any
  ) {
    super(message);
  }
}

/** A mensagem do Nest: texto, ou lista (validação) numa linha cada */
const mensagemDe = (corpo: any, status: number) => {
  const m = corpo?.message;
  if (Array.isArray(m)) return m.join('\n');
  if (typeof m === 'string' && m) return m;
  return status >= 500
    ? 'O servidor não conseguiu responder agora. Tente de novo.'
    : 'Algo deu errado. Tente de novo.';
};

type Opcoes = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Chama a API com o token da sessão. Erro vira `ErroDaApi` com a mensagem do
 * servidor. 401 com a sessão aberta encerra a sessão — menos no
 * `/auth/validate`, que a própria sessão trata.
 */
export async function api<T = any>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const ehForm = opcoes.body instanceof FormData;
  let resposta: Response;
  try {
    resposta = await fetch(API_URL + caminho, {
      method: opcoes.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opcoes.body !== undefined && !ehForm ? { 'Content-Type': 'application/json' } : {}),
        ...opcoes.headers,
      },
      body:
        opcoes.body === undefined
          ? undefined
          : ehForm
            ? (opcoes.body as FormData)
            : JSON.stringify(opcoes.body),
    });
  } catch {
    throw new ErroDaApi(0, 'Sem conexão com o servidor. Confira a internet e tente de novo.', null);
  }

  const texto = await resposta.text();
  let corpo: any = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = texto;
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && token && !caminho.startsWith('/auth/validate')) {
      aoExpirar?.(corpo?.code === 'CONTA_BLOQUEADA');
    }
    throw new ErroDaApi(resposta.status, mensagemDe(corpo, resposta.status), corpo);
  }
  return corpo as T;
}

/** Um arquivo escolhido no celular, no formato que o `FormData` do RN aceita */
export const arquivoDoForm = (uri: string, name: string, type: string) =>
  ({ uri, name, type }) as unknown as Blob;

/**
 * Baixa um PDF da API (certificado, quadrante) e abre o compartilhar do
 * sistema, de onde a pessoa salva ou manda. `X-Pedido-Pdf` é o código da fila
 * de PDFs do servidor; a posição na fila não é mostrada aqui.
 */
export async function baixarPdf(caminho: string, nomePadrao: string) {
  let resposta: Response;
  try {
    resposta = await fetch(API_URL + caminho, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Pedido-Pdf': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
  } catch {
    throw new ErroDaApi(0, 'Sem conexão com o servidor.', null);
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new ErroDaApi(resposta.status, corpo?.message || 'Não foi possível gerar o PDF.', corpo);
  }
  const nome =
    /filename="(.+)"/.exec(resposta.headers.get('content-disposition') ?? '')?.[1] ?? nomePadrao;
  const arquivo = new File(Paths.cache, nome);
  arquivo.create({ overwrite: true });
  await arquivo.write(await resposta.arrayBuffer());
  await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/pdf' });
}

/** Grava um data URI (o modelo do termo do menor) e abre o compartilhar */
export async function compartilharDataUri(dataUri: string, nomeBase: string) {
  const [cabecalho, base64] = dataUri.split(',');
  const mime = /data:([^;]+)/.exec(cabecalho)?.[1] ?? 'application/octet-stream';
  const extensao = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin';
  const arquivo = new File(Paths.cache, `${nomeBase}.${extensao}`);
  arquivo.create({ overwrite: true });
  await arquivo.write(base64, { encoding: 'base64' });
  await Sharing.shareAsync(arquivo.uri, { mimeType: mime });
}
