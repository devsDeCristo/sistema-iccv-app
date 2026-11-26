import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { Aviso, Botao, Cartao, Carregando, Chip, T, Tela, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { moeda } from '@/lib/formato';
import { queryClient, useUsuario } from '@/lib/sessao';
import type { PixDoCheckout } from '@/lib/tipos';

type Situacao = 'pago' | 'analise' | 'encerrado' | 'substituido' | 'expirado' | 'aguardando';

const situacaoDe = (pix: PixDoCheckout, agora: number): Situacao =>
  pix.status === 'PAID'
    ? 'pago'
    : pix.status === 'IN_ANALYSIS'
      ? 'analise'
      : pix.status !== 'WAITING'
        ? 'encerrado'
        : !pix.active
          ? 'substituido'
          : // Pix estático não vence: o código é fixo, e a baixa é de quem administra
            !pix.manual && new Date(pix.expiresAt).getTime() <= agora
            ? 'expirado'
            : 'aguardando';

/**
 * O Pix pago dentro do app, com QR dinâmico criado na API do gateway (PayPal,
 * Mercado Pago, PagBank, Ton) — as outras formas seguem no checkout
 * hospedado. Consulta a cada 5 s enquanto aguarda; "Já paguei" pede ao
 * servidor que confira no gateway.
 */
export default function Pix() {
  const { id, referenceId } = useLocalSearchParams<{ id: string; referenceId: string }>();
  const cores = useTheme();
  const { data: usuario } = useUsuario();
  const [agora, setAgora] = useState(() => Date.now());
  const [copiado, setCopiado] = useState(false);
  const caminho = `/events/${id}/users/${usuario?.id}/payments/pix/${referenceId}`;
  const chave = ['pix', id, referenceId];

  const pix = useQuery({
    queryKey: chave,
    queryFn: () => api<PixDoCheckout>(caminho),
    enabled: !!usuario,
    retry: false,
    refetchInterval: (q) => (q.state.data && situacaoDe(q.state.data, Date.now()) === 'aguardando' ? 5000 : false),
  });
  const situacao = pix.data ? situacaoDe(pix.data, agora) : null;

  const conferir = useMutation({
    mutationFn: () => api<PixDoCheckout>(`${caminho}/check`, { method: 'POST' }),
    onSuccess: (novo) => {
      queryClient.setQueryData(chave, novo);
      if (novo.status === 'WAITING') {
        Alert.alert(
          'Ainda não recebemos a confirmação',
          'Se você já pagou, aguarde alguns instantes e tente de novo.'
        );
      }
    },
    onError: (erro) => Alert.alert('Não foi possível conferir', erro.message),
  });

  useEffect(() => {
    if (situacao !== 'aguardando') return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [situacao]);

  useEffect(() => {
    if (situacao === 'pago' || situacao === 'analise') {
      queryClient.invalidateQueries({ queryKey: ['inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['evento', id] });
    }
  }, [situacao, id]);

  const copiar = async () => {
    await Clipboard.setStringAsync(pix.data!.code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  const irParaInscricoes = () => router.navigate('/inscricoes');

  if (pix.isPending) return <Carregando />;
  if (pix.isError || !pix.data) {
    return (
      <Vazio
        icone="error-outline"
        texto="Este pagamento não foi encontrado. Gere o pagamento de novo em Minhas inscrições."
      >
        <Botao titulo="Ir para Minhas inscrições" variante="contorno" onPress={irParaInscricoes} />
      </Vazio>
    );
  }

  const p = pix.data;
  const segundos = Math.max(0, Math.floor((new Date(p.expiresAt).getTime() - agora) / 1000));
  const restante = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Pagamento com Pix' }} />
      <Tela>
        <Cartao style={{ alignItems: 'center' }}>
          {/* Pix estático vai direto para a conta da igreja: o gateway não processa */}
          {p.provider === 'PAYPAL' && !p.manual && (
            <Image
              source={require('@/assets/images/paypal.png')}
              style={{ width: 110, height: 36 }}
              contentFit="contain"
              accessibilityLabel="PayPal"
            />
          )}
          <T v="destaque">
            {p.manual ? 'Pix para a organização do evento' : `Processado pelo ${p.providerLabel}`}
          </T>
          <T v="pequeno" style={{ textAlign: 'center' }}>
            {p.manual
              ? 'No app do seu banco, o recebedor aparece com o nome da conta da igreja.'
              : 'No app do seu banco, o recebedor pode aparecer com esse nome.'}
          </T>
          <T v="secundario">{p.eventName}</T>
          {p.amountCents !== null && <T v="titulo">{moeda(p.amountCents / 100)}</T>}
          {!!p.serviceFeeCents && (
            <Chip
              // a taxa é fração do cobrado: taxa ÷ total dá o percentual configurado
              texto={`inclui ${moeda(p.serviceFeeCents / 100)} de taxa de serviço${
                p.amountCents
                  ? ` (${String(Math.round((p.serviceFeeCents / p.amountCents) * 10000) / 100).replace('.', ',')}%)`
                  : ''
              }`}
              cor={cores.chips.alert}
              icone="receipt-long"
            />
          )}
        </Cartao>

        {situacao === 'aguardando' && (
          <>
            <T>Copie o código e cole na opção “Pix Copia e Cola” do app do seu banco.</T>
            <Cartao>
              <T selectable v="pequeno" style={{ fontFamily: 'monospace' }}>
                {p.code}
              </T>
            </Cartao>
            <Botao
              titulo={copiado ? 'Código copiado' : 'Copiar código Pix'}
              icone={copiado ? 'check' : 'content-copy'}
              onPress={copiar}
            />
            {/* Pix estático: sem prazo e sem confirmação automática, não há o que contar nem esperar */}
            {!p.manual && (
              <>
                <View style={{ alignItems: 'center' }}>
                  <T v="destaque" style={{ color: cores.warning }}>
                    Aguardando pagamento
                  </T>
                  <T v="secundario">Expira em {restante}</T>
                </View>
                <Botao titulo="Já paguei" variante="contorno" carregando={conferir.isPending} onPress={() => conferir.mutate()} />
              </>
            )}
          </>
        )}
        {situacao === 'pago' && (
          <>
            <Aviso tipo="sucesso">Pagamento confirmado. Recebemos o seu Pix. Não é preciso fazer mais nada.</Aviso>
            <Botao titulo="Voltar ao evento" onPress={() => router.back()} />
          </>
        )}
        {situacao === 'analise' && (
          <>
            <Aviso>Pagamento em análise. O pagamento chegou e está sendo conferido pela organização do evento.</Aviso>
            <Botao titulo="Ir para Minhas inscrições" onPress={irParaInscricoes} />
          </>
        )}
        {situacao === 'encerrado' && (
          <>
            <Aviso tipo="alerta">
              Este pagamento não está mais disponível. Veja a situação em Minhas inscrições.
            </Aviso>
            <Botao titulo="Ir para Minhas inscrições" onPress={irParaInscricoes} />
          </>
        )}
        {(situacao === 'expirado' || situacao === 'substituido') && (
          <>
            <Aviso tipo="alerta">
              {p.manual
                ? 'Este código foi substituído por um pagamento mais novo. Use o de Minhas inscrições › Pagar.'
                : situacao === 'expirado'
                  ? 'Este código expirou. Gere um novo em Minhas inscrições › Pagar.'
                  : 'Este código foi substituído por um pagamento mais novo. Use o de Minhas inscrições › Pagar.'}
            </Aviso>
            <Botao titulo="Ir para Minhas inscrições" onPress={irParaInscricoes} />
            {!p.manual && (
              <Botao titulo="Já paguei" variante="contorno" carregando={conferir.isPending} onPress={() => conferir.mutate()} />
            )}
          </>
        )}
      </Tela>
    </>
  );
}
