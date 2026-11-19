import { useQuery } from '@tanstack/react-query';

import { api } from './api';
import { useUsuario } from './sessao';
import type {
  Evento,
  EventoDoCatalogo,
  GruposDoUsuario,
  Inscricao,
  Noticia,
} from './tipos';

/** O catálogo de eventos (o servidor já tira os de teste de quem não administra) */
export const useEventos = () =>
  useQuery({ queryKey: ['eventos'], queryFn: () => api<EventoDoCatalogo[]>('/events') });

export const useEvento = (id: string) =>
  useQuery({ queryKey: ['evento', id], queryFn: () => api<Evento>(`/events/${id}`) });

/** Em quais grupos a pessoa está inscrita ou na lista de espera */
export const useMeusGrupos = () => {
  const { data: usuario } = useUsuario();
  return useQuery({
    queryKey: ['grupos'],
    queryFn: () => api<GruposDoUsuario>(`/users/${usuario!.id}/groups`),
    enabled: !!usuario,
  });
};

/** Minhas inscrições: um item por evento, com os pagamentos */
export const useInscricoes = () => {
  const { data: usuario } = useUsuario();
  return useQuery({
    queryKey: ['inscricoes'],
    queryFn: () => api<Inscricao[]>(`/users/${usuario!.id}/payments`),
    enabled: !!usuario,
  });
};

export const useNoticias = () =>
  useQuery({ queryKey: ['noticias'], queryFn: () => api<Noticia[]>('/news?take=6') });

/** O cadastro completo de quem está logado (perfil, data de nascimento) */
export const useMeuCadastro = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api<Record<string, any>>('/users/me') });

/** "Inscrito" ou "Lista de espera" por evento; inscrito vence */
export function situacaoPorEvento(grupos?: GruposDoUsuario) {
  const mapa = new Map<string, 'inscrito' | 'espera'>();
  grupos?.waitlist.forEach((g) => mapa.set(g.eventId, 'espera'));
  grupos?.present.forEach((g) => mapa.set(g.eventId, 'inscrito'));
  return mapa;
}
