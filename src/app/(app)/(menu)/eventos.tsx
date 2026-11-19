import { CartazDoEvento } from '@/components/cartaz';
import { Carregando, Falha, Secao, Tela, Vazio } from '@/components/ui';
import { situacaoPorEvento, useEventos, useMeusGrupos } from '@/lib/consultas';

/** Todos os eventos, inclusive os que já passaram, por ano (o mais novo primeiro) */
export default function Eventos() {
  const eventos = useEventos();
  const grupos = useMeusGrupos();

  if (eventos.isPending) return <Carregando />;
  if (eventos.isError) return <Falha erro={eventos.error} aoTentar={eventos.refetch} />;

  const lista = eventos.data
    .filter((e) => e.status !== 'INACTIVE')
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
  const situacao = situacaoPorEvento(grupos.data);
  const porAno = new Map<string, typeof lista>();
  for (const e of lista) {
    const ano = e.startDate ? String(new Date(e.startDate).getFullYear()) : 'Sem data';
    porAno.set(ano, [...(porAno.get(ano) ?? []), e]);
  }

  return (
    <Tela
      aoAtualizar={() => {
        eventos.refetch();
        grupos.refetch();
      }}
      atualizando={eventos.isRefetching}
    >
      {lista.length === 0 && <Vazio icone="event-note" texto="Nenhum evento por aqui ainda." />}
      {[...porAno].flatMap(([ano, doAno]) => [
        <Secao key={ano} titulo={ano} contagem={doAno.length} />,
        ...doAno.map((e) => <CartazDoEvento key={e.id} evento={e} situacao={situacao.get(e.id)} />),
      ])}
    </Tela>
  );
}
