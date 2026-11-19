import * as DocumentPicker from 'expo-document-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Capa } from '@/components/cartaz';
import { Aviso, Botao, Cartao, Carregando, Chip, Falha, Marcador, Secao, T, Tela, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api, arquivoDoForm, baixarPdf } from '@/lib/api';
import { useEventos, useInscricoes } from '@/lib/consultas';
import {
  corDoPagamento,
  pagamentosEmAberto,
  podePagar,
  ROTULO_DO_PAGAMENTO,
  valorEmAberto,
} from '@/lib/eventos';
import { data, moeda, periodo, preco } from '@/lib/formato';
import { pagar } from '@/lib/pagamento';
import { queryClient, useUsuario } from '@/lib/sessao';
import type { ItemDeProduto } from '@/lib/tipos';

const descreverItem = (i: ItemDeProduto) => `${i.variant.product.name} (${i.variant.name}) ×${i.quantity}`;

/**
 * O ingresso de um evento: as pendências (termo do menor, lista de espera,
 * pagamento), o que foi comprado e o pagamento do que está em aberto.
 */
export default function Ingresso() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const cores = useTheme();
  const { data: usuario } = useUsuario();
  const inscricoes = useInscricoes();
  const eventos = useEventos();
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [ocupado, setOcupado] = useState<'termo' | 'pagar' | 'certificado' | null>(null);

  if (inscricoes.isPending) return <Carregando />;
  if (inscricoes.isError) return <Falha erro={inscricoes.error} aoTentar={inscricoes.refetch} />;
  const i = inscricoes.data.find((x) => x.eventId === eventId);
  if (!i) return <Vazio icone="confirmation-number" texto="Inscrição não encontrada." />;

  const evento = eventos.data?.find((e) => e.id === eventId);
  const emAberto = pagamentosEmAberto(i);
  const menor = i.minorApprovalStatus;

  // o que pode entrar no pagamento: chave → ingresso (roleId) ou compra (paymentId)
  const pagaveis = [
    ...i.registeredRoles
      .filter((r) => podePagar(r.paymentStatus, r.paymentMethod))
      .map((r) => ({ chave: `r:${r.roleId}`, roleId: r.roleId, valor: r.amount ?? r.price })),
    ...i.productPurchases
      .filter((p) => podePagar(p.status, p.method))
      .map((p) => ({ chave: `p:${p.id}`, paymentId: p.id, valor: p.amount })),
  ].filter((x) => x.valor > 0);
  // começa com tudo marcado: o caso comum é pagar tudo de uma vez
  const marcado = (chave: string) => marcados[chave] ?? true;
  const escolhidos = pagaveis.filter((x) => marcado(x.chave));

  const enviarTermo = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (r.canceled) return;
    const arquivo = r.assets[0];
    const form = new FormData();
    form.append('termFile', arquivoDoForm(arquivo.uri, arquivo.name, arquivo.mimeType ?? 'application/octet-stream'));
    setOcupado('termo');
    try {
      await api(`/events/${eventId}/users/${usuario!.id}/guardian-term`, { method: 'POST', body: form });
      await queryClient.invalidateQueries({ queryKey: ['inscricoes'] });
      Alert.alert('Termo enviado!', 'O admin do evento vai conferir e liberar a inscrição.');
    } catch (erro) {
      Alert.alert('Não foi possível enviar o termo', (erro as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const pagarEscolhidos = async () => {
    setOcupado('pagar');
    await pagar({
      eventId,
      userId: usuario!.id,
      roleIds: escolhidos.flatMap((x) => ('roleId' in x ? [x.roleId] : [])),
      paymentIds: escolhidos.flatMap((x) => ('paymentId' in x ? [x.paymentId] : [])),
    });
    setOcupado(null);
  };

  const certificado = async () => {
    setOcupado('certificado');
    try {
      await baixarPdf(`/events/${eventId}/certificates/me/pdf`, 'certificado.pdf');
    } catch (erro) {
      Alert.alert('Não foi possível gerar o certificado', (erro as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ingresso' }} />
      <Tela aoAtualizar={() => inscricoes.refetch()} atualizando={inscricoes.isRefetching}>
        <Capa url={i.data?.coverUrl} logo={i.data?.logoUrl}>
          <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>INGRESSO</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{i.eventName}</Text>
          {evento && (
            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{periodo(evento.startDate, evento.endDate, true)}</Text>
          )}
        </Capa>

        {menor === 'PENDING' && !i.signedTermUrl && (
          <Aviso tipo="alerta">
            <T v="destaque">Termo do responsável pendente</T>
            <T v="secundario">Pela sua idade, a inscrição só vale com o termo assinado pelos pais ou responsáveis.</T>
            <Botao titulo="Anexar termo" variante="texto" icone="attach-file" carregando={ocupado === 'termo'} onPress={enviarTermo} />
          </Aviso>
        )}
        {menor === 'PENDING' && !!i.signedTermUrl && (
          <Aviso>
            <T v="destaque">Aguardando aprovação do termo</T>
            <Botao titulo="Reenviar termo" variante="texto" icone="attach-file" carregando={ocupado === 'termo'} onPress={enviarTermo} />
          </Aviso>
        )}
        {menor === 'REJECTED' && (
          <Aviso tipo="erro">
            <T v="destaque">Termo do responsável recusado</T>
            <T v="secundario">
              {i.minorApprovalRejectionReason || 'A organização pediu um novo envio do termo.'}
            </T>
            <Botao titulo="Reenviar termo" variante="texto" icone="attach-file" carregando={ocupado === 'termo'} onPress={enviarTermo} />
          </Aviso>
        )}
        {i.waitlistRoles.length > 0 && (
          <Aviso>
            {`Na lista de espera: sua vaga em ${i.waitlistRoles.map((w) => w.group).join(', ')} ainda não está garantida. Você entra se uma vaga abrir.`}
          </Aviso>
        )}
        {emAberto > 0 && (
          <Aviso tipo="alerta">
            {`${emAberto} ${emAberto === 1 ? 'pagamento pendente' : 'pagamentos pendentes'} · ${moeda(valorEmAberto(i))}. ${
              i.modulePayment
                ? 'Use o botão Pagar, aqui embaixo, para concluir.'
                : 'Esta igreja não recebe pelo site: acerte o pagamento com a organização do evento.'
            }`}
          </Aviso>
        )}

        {(i.registeredRoles.length > 0 || i.waitlistRoles.length > 0) && <Secao titulo="Inscrições" />}
        {i.registeredRoles.map((r) => {
          const status = r.paymentStatus ?? 'WAITING';
          return (
            <Cartao key={r.roleId}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <T v="destaque" style={{ flex: 1 }}>
                  {r.group} · {r.description}
                </T>
                <T v="destaque">{preco(r.amount ?? r.price)}</T>
              </View>
              <Chip texto={ROTULO_DO_PAGAMENTO[status]} cor={corDoPagamento(status, cores)} />
              {r.products.map((p) => (
                <T key={p.id} v="secundario">
                  {descreverItem(p)} · {moeda(p.unitPrice * p.quantity)}
                </T>
              ))}
            </Cartao>
          );
        })}
        {i.waitlistRoles.map((w) => (
          <Cartao key={w.roleId}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <T v="destaque" style={{ flex: 1 }}>
                {w.group} · {w.description}
              </T>
              <T v="destaque">{preco(w.price)}</T>
            </View>
            <Chip texto="Lista de espera" cor={cores.info} />
          </Cartao>
        ))}

        {i.productPurchases.length > 0 && <Secao titulo="Compras na loja" />}
        {i.productPurchases.map((p) => (
          <Cartao key={p.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <T v="destaque" style={{ flex: 1 }}>
                {p.productItems.length === 1 ? descreverItem(p.productItems[0]) : `${p.productItems.length} produtos`}
              </T>
              <T v="destaque">{moeda(p.amount)}</T>
            </View>
            {p.productItems.length > 1 &&
              p.productItems.map((item) => (
                <T key={item.id} v="secundario">
                  {descreverItem(item)}
                </T>
              ))}
            <T v="pequeno">Comprado em {data(p.createdAt)}</T>
            <Chip texto={ROTULO_DO_PAGAMENTO[p.status]} cor={corDoPagamento(p.status, cores)} />
          </Cartao>
        ))}

        {i.modulePayment && pagaveis.length > 0 && (
          <>
            <Secao titulo="Pagar" />
            <Cartao>
              {pagaveis.map((x) => {
                const role = 'roleId' in x ? i.registeredRoles.find((r) => r.roleId === x.roleId) : null;
                const compra = 'paymentId' in x ? i.productPurchases.find((p) => p.id === x.paymentId) : null;
                return (
                  <Marcador
                    key={x.chave}
                    marcado={marcado(x.chave)}
                    aoMudar={(v) => setMarcados({ ...marcados, [x.chave]: v })}
                  >
                    <T>
                      {role ? `Ingresso ${role.group} — ${role.description}` : `Compra de produtos (${compra?.productItems.length})`}
                    </T>
                    <T v="secundario">{moeda(x.valor)}</T>
                  </Marcador>
                );
              })}
              <Botao
                titulo={`Pagar ${moeda(escolhidos.reduce((s, x) => s + x.valor, 0))}`}
                icone="payment"
                desabilitado={!escolhidos.length}
                carregando={ocupado === 'pagar'}
                onPress={pagarEscolhidos}
              />
            </Cartao>
          </>
        )}

        {i.certificateAvailable && (
          <Botao
            titulo={ocupado === 'certificado' ? 'Gerando…' : 'Certificado'}
            variante="contorno"
            icone="workspace-premium"
            carregando={ocupado === 'certificado'}
            onPress={certificado}
          />
        )}
        <Botao titulo="Ver evento" variante="texto" onPress={() => router.push(`/evento/${eventId}`)} />
      </Tela>
    </>
  );
}
