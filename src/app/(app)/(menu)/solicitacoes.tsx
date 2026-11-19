import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Aviso, Botao, Cartao, Carregando, Chip, Falha, Secao, T, Tela, TituloDaPagina, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { data } from '@/lib/formato';
import { useUsuario } from '@/lib/sessao';

type Status =
  | 'REQUESTED'
  | 'IN_REVIEW'
  | 'AWAITING_TREASURY'
  | 'AWAITING_PASTOR'
  | 'ACCEPTED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED';

type Solicitacao = {
  id: string;
  ministry: string;
  title: string;
  description: string;
  status: Status;
  response: string | null;
  createdAt: string;
  items: { id: string; name: string; quantity: number; accepted: boolean | null }[];
  church: { id: string; name: string };
};

const ROTULO: Record<Status, string> = {
  REQUESTED: 'Solicitado',
  IN_REVIEW: 'Em análise',
  AWAITING_TREASURY: 'Aguardando tesouraria',
  AWAITING_PASTOR: 'Aguardando pastor',
  ACCEPTED: 'Aceito',
  PARTIALLY_ACCEPTED: 'Aceito parcialmente',
  REJECTED: 'Recusado',
};
const RESPONDIDA: Status[] = ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'];

/** O que o membro pediu à igreja e a resposta dela */
export default function Solicitacoes() {
  const cores = useTheme();
  const { data: usuario } = useUsuario();
  const igreja = usuario?.memberChurch;
  const podePedir = !!igreja?.modulos.includes('REQUESTS');
  const lista = useQuery({
    queryKey: ['solicitacoes'],
    queryFn: () => api<Solicitacao[]>('/solicitacoes/minhas'),
  });

  const cor = (s: Status) =>
    s === 'REJECTED'
      ? cores.danger
      : RESPONDIDA.includes(s)
        ? cores.success
        : s === 'IN_REVIEW'
          ? cores.warning
          : cores.info;

  const cartao = (s: Solicitacao) => (
    <Cartao key={s.id}>
      <Chip texto={ROTULO[s.status]} cor={cor(s.status)} />
      <T v="destaque">{s.title}</T>
      <T v="pequeno">
        {s.ministry} · {data(s.createdAt)}
      </T>
      <T v="secundario" numberOfLines={3}>
        {s.description}
      </T>
      {s.items.map((item) => (
        <T
          key={item.id}
          v="secundario"
          style={item.accepted === false ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}
        >
          {item.accepted === true ? '✓' : item.accepted === false ? '✗' : '•'} {item.quantity}× {item.name}
        </T>
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: cores.border, paddingTop: 8 }}>
        <T v="secundario">{s.response || 'Ainda sem resposta'}</T>
      </View>
    </Cartao>
  );

  const aguardando = lista.data?.filter((s) => !RESPONDIDA.includes(s.status)) ?? [];
  const respondidas = lista.data?.filter((s) => RESPONDIDA.includes(s.status)) ?? [];

  return (
    <>
      <Tela aoAtualizar={() => lista.refetch()} atualizando={lista.isRefetching}>
        <TituloDaPagina>Solicitações</TituloDaPagina>
        {podePedir ? (
          <Botao titulo="Nova solicitação" icone="add" onPress={() => router.push('/solicitacoes/nova')} />
        ) : (
          <Aviso>
            {igreja
              ? `A ${igreja.name} ainda não recebe solicitações por aqui.`
              : 'Só quem é membro de uma igreja faz solicitações a ela.'}
          </Aviso>
        )}
        {lista.isPending ? (
          <Carregando />
        ) : lista.isError ? (
          <Falha erro={lista.error} aoTentar={lista.refetch} />
        ) : lista.data.length === 0 ? (
          podePedir && (
            <Vazio
              icone="assignment"
              texto="Você ainda não fez nenhuma solicitação. Use “Nova solicitação” para pedir um equipamento ou uma melhoria."
            />
          )
        ) : (
          <>
            {aguardando.length > 0 && <Secao titulo="Aguardando" contagem={aguardando.length} />}
            {aguardando.map(cartao)}
            {respondidas.length > 0 && <Secao titulo="Respondidos" contagem={respondidas.length} />}
            {respondidas.map(cartao)}
          </>
        )}
      </Tela>
    </>
  );
}
