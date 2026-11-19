import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet } from 'react-native';

import { Botao, T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { api, ErroDaApi } from './api';
import { queryClient } from './sessao';

type Escolha = { provider: string; label: string };
type Metodo = 'PIX' | 'CREDIT_CARD';

export const AVISO_FORA_DO_SITE =
  'Esta igreja não recebe pagamento pelo site. O valor é combinado diretamente com a organização do evento.';

/**
 * A pergunta "Como você quer pagar?" — só o PayPal pede (Pix no app, cartão
 * no site dele). Fica montada uma vez (`PerguntaDePagamento`) e o fluxo de
 * pagamento a chama como uma promessa.
 */
let abrirPergunta: ((escolha: Escolha) => Promise<Metodo | null>) | null = null;

export function PerguntaDePagamento() {
  const cores = useTheme();
  const [pendente, setPendente] = useState<{
    escolha: Escolha;
    responder: (m: Metodo | null) => void;
  } | null>(null);

  useEffect(() => {
    abrirPergunta = (escolha) => new Promise((responder) => setPendente({ escolha, responder }));
    return () => {
      abrirPergunta = null;
    };
  }, []);

  const responder = (m: Metodo | null) => {
    pendente?.responder(m);
    setPendente(null);
  };
  const label = pendente?.escolha.label ?? '';

  return (
    <Modal transparent visible={!!pendente} animationType="fade" onRequestClose={() => responder(null)}>
      <Pressable style={styles.fundo} onPress={() => responder(null)}>
        <Pressable style={[styles.caixa, { backgroundColor: cores.card }]}>
          {pendente?.escolha.provider === 'PAYPAL' && (
            <Image
              source={require('@/assets/images/paypal.png')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="PayPal"
            />
          )}
          <T v="titulo" style={{ textAlign: 'center' }}>
            Como você quer pagar?
          </T>
          <T v="secundario" style={{ textAlign: 'center' }}>
            O pagamento é processado pelo {label}.
          </T>
          <T>• Pix: o código aparece aqui no app, e a confirmação sai na hora.</T>
          <T>• Cartão ou conta {label}: você conclui o pagamento no site do {label}.</T>
          <Botao titulo="Pix" onPress={() => responder('PIX')} />
          <Botao titulo={`Cartão ou conta ${label}`} variante="contorno" onPress={() => responder('CREDIT_CARD')} />
          <Botao titulo="Agora não" variante="texto" onPress={() => responder(null)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const PIX_NO_APP = /\/eventos\/([^/]+)\/pagamento\/pix\/([^/?#]+)/;

/** Depois de pagar (ou desistir), as telas que mostram pagamento recarregam */
const recarregar = (eventId: string) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['inscricoes'] }),
    queryClient.invalidateQueries({ queryKey: ['grupos'] }),
    queryClient.invalidateQueries({ queryKey: ['evento', eventId] }),
  ]);

/**
 * Cria a cobrança e manda a pessoa pagar: o checkout hospedado do gateway num
 * navegador dentro do app, ou — no Pix do PayPal — a tela de Pix do próprio
 * app (o link aponta para a tela web de Pix; o app reconhece e abre a sua).
 *
 * Devolve `false` quando não houve cobrança (desistiu, fora do site, erro).
 */
export async function pagar(opcoes: {
  eventId: string;
  userId: string;
  roleIds?: string[];
  paymentIds?: string[];
}): Promise<boolean> {
  const caminho = `/events/${opcoes.eventId}/users/${opcoes.userId}/payments`;
  const corpo = { roleRegistrationId: opcoes.roleIds ?? [], paymentIds: opcoes.paymentIds ?? [] };

  try {
    let resposta = await api<{ link?: string; choice?: Escolha }>(caminho, {
      method: 'POST',
      body: corpo,
    });
    if (resposta.choice) {
      const metodo = await abrirPergunta?.(resposta.choice);
      if (!metodo) return false;
      resposta = await api(caminho, { method: 'POST', body: { ...corpo, method: metodo } });
    }
    if (!resposta.link) return false;

    const pix = PIX_NO_APP.exec(resposta.link);
    if (pix) {
      router.push(`/evento/${pix[1]}/pix/${pix[2]}`);
      return true;
    }
    await WebBrowser.openBrowserAsync(resposta.link);
    await recarregar(opcoes.eventId);
    return true;
  } catch (erro) {
    if (erro instanceof ErroDaApi && erro.status === 503) {
      Alert.alert('Pagamento fora do site', AVISO_FORA_DO_SITE);
    } else {
      Alert.alert('Não foi possível abrir o pagamento', (erro as Error).message);
    }
    return false;
  }
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  caixa: { borderRadius: 16, padding: 20, gap: 12 },
  logo: { width: 120, height: 40, alignSelf: 'center' },
});
