import { useMutation, useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Alert, View } from 'react-native';

import { Botao, Cartao, Carregando, Falha, T, Tela, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { tempoDesde } from '@/lib/formato';
import { queryClient } from '@/lib/sessao';
import type { Notificacao } from '@/lib/tipos';

/** Para onde cada aviso leva no app; os do painel da igreja ficam no site */
function destino(n: Notificacao): string | null {
  switch (n.tipo) {
    case 'EVENT':
      return n.origemId ? `/evento/${n.origemId}` : '/';
    case 'NEWS':
    case 'MEMBERSHIP_ANSWERED':
      return '/';
    case 'CHURCH_REQUEST_ANSWERED':
      return '/solicitacoes';
    default:
      return null;
  }
}

/** Os 30 avisos mais recentes. Tocar marca aquele como lido e abre o assunto */
export default function Avisos() {
  const cores = useTheme();
  const avisos = useQuery({ queryKey: ['notificacoes'], queryFn: () => api<Notificacao[]>('/notificacoes') });

  const marcar = useMutation({
    // sem `ids` marca todos; lista vazia o servidor recusa
    mutationFn: (ids?: string[]) => api('/notificacoes/lidas', { method: 'POST', body: ids ? { ids } : {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['nao-lidas'] });
    },
  });

  const abrir = (n: Notificacao) => {
    if (!n.lida) marcar.mutate([n.id]);
    const rota = destino(n);
    if (rota) router.navigate(rota as never);
    else Alert.alert(n.titulo, `${n.texto}\n\nEste assunto é do painel da igreja: abra pelo site.`);
  };

  if (avisos.isPending) return <Carregando />;
  if (avisos.isError) return <Falha erro={avisos.error} aoTentar={avisos.refetch} />;
  const temNaoLida = avisos.data.some((n) => !n.lida);

  return (
    <>
      <Stack.Screen options={{ title: 'Avisos' }} />
      <Tela aoAtualizar={() => avisos.refetch()} atualizando={avisos.isRefetching}>
        {temNaoLida && (
          <Botao titulo="Marcar todas como lidas" variante="texto" icone="done-all" onPress={() => marcar.mutate(undefined)} />
        )}
        {avisos.data.length === 0 && <Vazio icone="notifications-none" texto="Nenhum aviso por aqui." />}
        {avisos.data.map((n) => (
          <Cartao key={n.id} onPress={() => abrir(n)} style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginTop: 7,
                backgroundColor: n.lida ? 'transparent' : cores.primary,
              }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="destaque">{n.titulo}</T>
              <T v="secundario">{n.texto}</T>
              <T v="pequeno">{tempoDesde(n.data)}</T>
            </View>
          </Cartao>
        ))}
      </Tela>
    </>
  );
}
