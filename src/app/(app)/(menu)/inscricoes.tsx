import { Text, View } from 'react-native';

import { CartaoDoIngresso } from '@/components/cartao-do-ingresso';
import { Carregando, Falha, Tela, TituloDaPagina, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useEventos, useInscricoes } from '@/lib/consultas';

/**
 * Todas as inscrições e compras, como a `/minhasInscricoes` do site: o título
 * da página e, por ano do evento (o mais recente primeiro), os ingressos na
 * versão grande — no celular, o canhoto empilhado embaixo.
 */
export default function MinhasInscricoes() {
  const cores = useTheme();
  const inscricoes = useInscricoes();
  const eventos = useEventos();

  if (inscricoes.isPending) return <Carregando />;
  if (inscricoes.isError) return <Falha erro={inscricoes.error} aoTentar={inscricoes.refetch} />;

  const catalogo = new Map((eventos.data ?? []).map((e) => [e.id, e]));
  const inicio = (eventId: string) => catalogo.get(eventId)?.startDate ?? '';
  const ordenadas = [...inscricoes.data].sort((a, b) => inicio(b.eventId).localeCompare(inicio(a.eventId)));
  const porAno = new Map<string, typeof ordenadas>();
  for (const i of ordenadas) {
    const ano = inicio(i.eventId) ? String(new Date(inicio(i.eventId)).getFullYear()) : 'Sem data';
    porAno.set(ano, [...(porAno.get(ano) ?? []), i]);
  }

  return (
    <Tela
      aoAtualizar={() => {
        inscricoes.refetch();
        eventos.refetch();
      }}
      atualizando={inscricoes.isRefetching}
    >
      <TituloDaPagina>Minhas Inscrições</TituloDaPagina>
      {ordenadas.length === 0 && (
        <Vazio
          icone="confirmation-number"
          texto="Você ainda não tem inscrições. Quando se inscrever em um evento, ele aparece aqui."
        />
      )}
      {[...porAno].flatMap(([ano, doAno]) => [
        <View key={ano} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: cores.text }}>{ano}</Text>
          <Text style={{ fontSize: 13, color: cores.textSecondary }}>
            {doAno.length === 1 ? '1 inscrição' : `${doAno.length} inscrições`}
          </Text>
        </View>,
        ...doAno.map((i) => <CartaoDoIngresso key={i.eventId} inscricao={i} evento={catalogo.get(i.eventId)} />),
      ])}
    </Tela>
  );
}
