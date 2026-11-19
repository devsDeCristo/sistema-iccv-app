export type Trecho = { texto: string; negrito?: boolean; italico?: boolean; link?: string };
export type Bloco = { tipo: 'p' | 'h' | 'li'; marcador?: string; trechos: Trecho[] };

const ENTIDADES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

const decodificar = (texto: string) =>
  texto.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (inteira, nome: string) => {
    if (nome[0] === '#') {
      const codigo = nome[1].toLowerCase() === 'x' ? parseInt(nome.slice(2), 16) : Number(nome.slice(1));
      return Number.isFinite(codigo) ? String.fromCodePoint(codigo) : inteira;
    }
    return ENTIDADES[nome.toLowerCase()] ?? inteira;
  });

/** Só abre link de verdade: nada de `javascript:` vindo do editor */
const LINK_SEGURO = /^(https?:|mailto:|tel:)/i;

/**
 * Lê o HTML do editor (Quill) em blocos de texto: parágrafos, títulos e itens
 * de lista, com negrito, itálico e links.
 */
export function lerHtml(html: string): Bloco[] {
  const blocos: Bloco[] = [];
  const listas: { tipo: string; n: number }[] = [];
  let atual: Bloco | null = null;
  let negrito = 0;
  let italico = 0;
  let link: string | undefined;

  const fechar = () => {
    if (atual?.trechos.some((t) => t.texto.trim())) blocos.push(atual);
    atual = null;
  };
  const abrir = (tipo: Bloco['tipo'], marcador?: string) => {
    fechar();
    atual = { tipo, marcador, trechos: [] };
  };

  for (const parte of html.split(/(<[^>]+>)/)) {
    if (!parte) continue;
    const tag = /^<\s*(\/?)\s*([a-z0-9]+)([^>]*)>$/i.exec(parte);
    if (!tag) {
      const texto = decodificar(parte.replace(/\s+/g, ' '));
      if (!texto.trim() && !atual) continue;
      atual ??= { tipo: 'p', trechos: [] };
      (atual as Bloco).trechos.push({ texto, negrito: negrito > 0, italico: italico > 0, link });
      continue;
    }
    const fecha = tag[1] === '/';
    const nome = tag[2].toLowerCase();
    if (nome === 'br') {
      (atual as Bloco | null)?.trechos.push({ texto: '\n' });
    } else if (['p', 'div', 'blockquote', 'pre'].includes(nome)) {
      if (fecha) fechar();
      else abrir('p');
    } else if (/^h[1-6]$/.test(nome)) {
      if (fecha) fechar();
      else abrir('h');
    } else if (nome === 'ul' || nome === 'ol') {
      fechar();
      if (fecha) listas.pop();
      else listas.push({ tipo: nome, n: 0 });
    } else if (nome === 'li') {
      if (fecha) fechar();
      else {
        const lista = listas[listas.length - 1];
        abrir('li', lista?.tipo === 'ol' ? `${++lista.n}.` : '•');
      }
    } else if (nome === 'strong' || nome === 'b') {
      negrito += fecha ? -1 : 1;
    } else if (nome === 'em' || nome === 'i' || nome === 'u') {
      italico += fecha ? -1 : 1;
    } else if (nome === 'a') {
      const href = /href\s*=\s*["']([^"']*)["']/i.exec(tag[3])?.[1];
      link = !fecha && href && LINK_SEGURO.test(href) ? decodificar(href) : undefined;
    }
  }
  fechar();
  return blocos;
}
