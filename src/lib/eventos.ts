import type { Cores } from '@/constants/theme';

import type { DadosDoEvento, GrupoDoEvento, Inscricao, StatusDoPagamento, Variante } from './tipos';

export type EstadoDoGrupo = 'inativo' | 'agendado' | 'aberto' | 'encerrado';

/** A janela de inscrição do grupo, como `estadoDoGrupo` do web */
export function estadoDoGrupo(grupo: GrupoDoEvento, fimDoEvento: string | null): EstadoDoGrupo {
  const agora = Date.now();
  if (grupo.active === false) return 'inativo';
  if (grupo.opensAt && new Date(grupo.opensAt).getTime() > agora) return 'agendado';
  const fecha = grupo.closesAt ?? fimDoEvento;
  if (fecha && agora >= new Date(fecha).getTime()) return 'encerrado';
  return 'aberto';
}

/**
 * Vagas do grupo. Capacidade nula é **sem limite**, como no servidor (o web
 * trata nula como esgotado e mostra "lista de espera" para grupo sem limite).
 */
export function ocupacao(grupo: GrupoDoEvento) {
  const inscritos = grupo.roles.reduce((soma, r) => soma + (r.registered ?? 0), 0);
  if (grupo.capacity == null) {
    return { percentual: 0, restantes: Infinity, esgotado: false, inscritos };
  }
  const restantes = Math.max(grupo.capacity - inscritos, 0);
  return {
    percentual: grupo.capacity > 0 ? Math.min(inscritos / grupo.capacity, 1) : 1,
    restantes,
    esgotado: restantes === 0,
    inscritos,
  };
}

/** O termo HTML tem conteúdo de verdade (texto, imagem ou vídeo) */
export const temTermo = (html?: string) =>
  !!html &&
  (/<(img|iframe|video)/i.test(html) ||
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim().length > 0);

/** Abaixo desta idade, na data do evento, pede o termo do responsável */
export const idadeDoTermo = (dados?: DadosDoEvento) => (dados?.minorAgeLimit === 18 ? 18 : 16);

export const quadranteAtivo = (dados?: DadosDoEvento) =>
  dados?.showQuadrante === true && dados?.modules?.teams !== false;

export const temDisponivel = (v: Variante) => v.available == null || v.available > 0;

export const QUANTIDADE_MAXIMA_POR_ITEM = 20;

export const ehCorHex = (v?: string) => !!v && /^#[0-9a-fA-F]{6}$/.test(v);

export const ROTULO_DO_PAGAMENTO: Record<StatusDoPagamento, string> = {
  PAID: 'Pago',
  IN_ANALYSIS: 'Em análise',
  DECLINED: 'Recusado',
  CANCELED: 'Cancelado',
  WAITING: 'Aguardando',
  REFUNDED: 'Reembolsado',
};

export const corDoPagamento = (status: StatusDoPagamento, cores: Cores) =>
  status === 'PAID'
    ? cores.success
    : status === 'IN_ANALYSIS'
      ? cores.info
      : status === 'WAITING'
        ? cores.warning
        : cores.textSecondary;

/** Pago, em análise, cancelado e estornado não pedem pagamento */
const RESOLVIDO: (StatusDoPagamento | null)[] = ['PAID', 'IN_ANALYSIS', 'CANCELED', 'REFUNDED'];

export const pagamentosEmAberto = (i: Inscricao) =>
  i.registeredRoles.filter((r) => !RESOLVIDO.includes(r.paymentStatus ?? 'WAITING')).length +
  i.productPurchases.filter((p) => !RESOLVIDO.includes(p.status)).length;

export const valorEmAberto = (i: Inscricao) =>
  i.registeredRoles
    .filter((r) => !RESOLVIDO.includes(r.paymentStatus ?? 'WAITING'))
    .reduce((soma, r) => soma + (r.amount ?? r.price), 0) +
  i.productPurchases
    .filter((p) => !RESOLVIDO.includes(p.status))
    .reduce((soma, p) => soma + p.amount, 0);

/**
 * Pode entrar num novo pagamento: não pago, não em análise e sem cobrança no
 * gateway em andamento (aguardando com método já escolhido). `OTHER` é "ainda
 * não começou" — e o Pix do PayPal fica assim até pagar, para a pessoa poder
 * voltar ao QR.
 */
export const podePagar = (status: StatusDoPagamento | null, metodo: string | null) => {
  const s = status ?? 'WAITING';
  return (
    s !== 'PAID' &&
    s !== 'IN_ANALYSIS' &&
    s !== 'REFUNDED' &&
    !(s === 'WAITING' && metodo !== 'OTHER')
  );
};
