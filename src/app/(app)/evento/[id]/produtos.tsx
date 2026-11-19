import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { OfertaDeProdutos, type ItemDaSacola } from '@/components/oferta-de-produtos';
import { Botao, Carregando, Falha, Tela, Vazio } from '@/components/ui';
import { api } from '@/lib/api';
import { useEvento, useMeusGrupos } from '@/lib/consultas';
import { temDisponivel } from '@/lib/eventos';
import { pagar } from '@/lib/pagamento';
import { queryClient, useUsuario } from '@/lib/sessao';

/**
 * A loja do evento: compra separada da inscrição, com pagamento próprio. Sem
 * `publicStore`, só quem tem inscrição confirmada compra.
 */
export default function Loja() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: usuario } = useUsuario();
  const evento = useEvento(id);
  const grupos = useMeusGrupos();
  const [enviando, setEnviando] = useState(false);

  if (evento.isPending) return <Carregando />;
  if (evento.isError) return <Falha erro={evento.error} aoTentar={evento.refetch} />;

  const e = evento.data;
  const doEvento = new Set(e.groupRoles.map((g) => g.id));
  const inscrito = (grupos.data?.present ?? []).some((g) => doEvento.has(g.id));
  const produtos = (e.products ?? []).filter((p) => p.variants.some(temDisponivel));
  // a loja usa só `modulePayment`, como no web; a resposta 503 do pagamento é a palavra final
  const cobraOnline = e.church?.modulePayment ?? true;

  const comprar = async (itens: ItemDaSacola[]) => {
    setEnviando(true);
    try {
      const { paymentId } = await api<{ paymentId: string }>(`/events/${id}/users/${usuario!.id}/products`, {
        method: 'POST',
        body: { items: itens },
      });
      await queryClient.invalidateQueries({ queryKey: ['inscricoes'] });
      router.back();
      if (cobraOnline) {
        pagar({ eventId: id, userId: usuario!.id, paymentIds: [paymentId] });
      } else {
        Alert.alert('Compra registrada!', 'O pagamento é feito diretamente com a organização do evento.');
      }
    } catch (erro) {
      evento.refetch();
      Alert.alert('Não foi possível concluir a compra', (erro as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Loja do evento' }} />
      <Tela>
        {produtos.length === 0 ? (
          <Vazio icone="storefront" texto="Este evento não tem produtos à venda no momento.">
            <Botao titulo="Voltar ao evento" variante="contorno" onPress={() => router.back()} />
          </Vazio>
        ) : (
          <OfertaDeProdutos
            produtos={produtos}
            titulo={e.name}
            subtitulo="Pagamento separado da inscrição"
            rotuloConfirmar={cobraOnline ? 'Finalizar compra' : 'Confirmar compra'}
            rotuloPular="Voltar ao evento"
            carregando={enviando}
            aoConfirmar={comprar}
            aoPular={() => router.back()}
            bloqueio={
              !inscrito && !e.data?.publicStore
                ? 'As compras desta loja são exclusivas para quem tem inscrição confirmada no evento. Quem está na lista de espera pode comprar quando a vaga sair.'
                : undefined
            }
          />
        )}
      </Tela>
    </>
  );
}
