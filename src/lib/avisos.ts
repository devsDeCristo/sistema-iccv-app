import { useQuery } from '@tanstack/react-query';

import { api } from './api';
import type { Notificacao } from './tipos';

/**
 * Os avisos que existem no app: só os do usuário comum. Os do painel da
 * igreja (pedido de membro, solicitação nova, solicitação aguardando) ficam
 * no site — o app não mostra, não conta no sininho e não manda push deles.
 * O push do backend segue a mesma lista.
 */
export const TIPOS_DO_APP = ['EVENT', 'NEWS', 'MEMBERSHIP_ANSWERED', 'CHURCH_REQUEST_ANSWERED'];

/** Para onde cada aviso leva ao tocar */
export function destino(n: Notificacao) {
  if (n.tipo === 'EVENT' && n.origemId) return `/evento/${n.origemId}`;
  if (n.tipo === 'CHURCH_REQUEST_ANSWERED') return '/solicitacoes';
  return '/';
}

/**
 * Os avisos do app, entre os 30 mais recentes que a API devolve. O sininho
 * conta os não lidos daqui, e não de `/notificacoes/nao-lidas`, que soma
 * também os do painel.
 */
// ponytail: só conta não lidos entre os 30 mais recentes; filtrar por tipo no servidor se alguém acumular mais
export const useAvisos = (opcoes?: { refetchInterval?: number }) =>
  useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => api<Notificacao[]>('/notificacoes'),
    select: (todos) => todos.filter((n) => TIPOS_DO_APP.includes(n.tipo)),
    ...opcoes,
  });
