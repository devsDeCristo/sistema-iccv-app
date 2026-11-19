import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { View } from 'react-native';

import { Botao, Cartao, Carregando, Falha, T, Tela, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { destino, useAvisos } from '@/lib/avisos';
import { tempoDesde } from '@/lib/formato';
import { queryClient } from '@/lib/sessao';
import type { Notificacao } from '@/lib/tipos';

/**
 * Os avisos do usuário (os do painel da igreja ficam no site; ver
 * `src/lib/avisos.ts`). Tocar marca aquele como lido e abre o assunto.
 */
export default function Avisos() {
  const cores = useTheme();
  const avisos = useAvisos();

  const marcar = useMutation({
    // sempre com `ids`: sem eles o servidor marcaria também os do painel, que o app não mostra
    mutationFn: (ids: string[]) => api('/notificacoes/lidas', { method: 'POST', body: { ids } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const abrir = (n: Notificacao) => {
    if (!n.lida) marcar.mutate([n.id]);
    router.navigate(destino(n) as never);
  };

  if (avisos.isPending) return <Carregando />;
  if (avisos.isError) return <Falha erro={avisos.error} aoTentar={avisos.refetch} />;
  const naoLidas = avisos.data.filter((n) => !n.lida).map((n) => n.id);

  return (
    <>
      <Stack.Screen options={{ title: 'Avisos' }} />
      <Tela aoAtualizar={() => avisos.refetch()} atualizando={avisos.isRefetching}>
        {naoLidas.length > 0 && (
          <Botao titulo="Marcar todas como lidas" variante="texto" icone="done-all" onPress={() => marcar.mutate(naoLidas)} />
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
