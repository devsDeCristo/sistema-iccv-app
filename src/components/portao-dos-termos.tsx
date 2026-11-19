import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { queryClient, useSessao } from '@/lib/sessao';

import { Html } from './html';
import { Botao, Carregando, Marcador, T } from './ui';

type StatusDosTermos = {
  versao: string | null;
  aceito: boolean;
  consentimentoDadosSensiveis: boolean;
  precisaDecidirDadosSensiveis: boolean;
};

/**
 * Antes de usar o app, a pessoa aceita a versão vigente dos Termos de Uso e
 * decide sobre os dados sensíveis (saúde e religião), quando for o caso — o
 * mesmo portão do web. A única outra saída é sair da conta.
 */
export function PortaoDosTermos() {
  const cores = useTheme();
  const { sair } = useSessao();
  const { data } = useQuery({
    queryKey: ['termos-status'],
    queryFn: () => api<StatusDosTermos>('/terms/status'),
    staleTime: Infinity,
    retry: false,
  });
  const [aceito, setAceito] = useState(false);
  const [sensiveis, setSensiveis] = useState<boolean | null>(null);
  // o texto abre aqui dentro: uma rota por cima ficaria escondida atrás do Modal
  const [lendo, setLendo] = useState(false);
  const termos = useQuery({
    queryKey: ['termos'],
    queryFn: () => api<{ content: string }>('/terms'),
    enabled: lendo,
  });

  const aceitar = useMutation({
    mutationFn: () =>
      api<StatusDosTermos>('/terms/accept', {
        method: 'POST',
        body: {
          accepted: true,
          ...(data?.precisaDecidirDadosSensiveis && { sensitiveDataConsent: sensiveis }),
        },
      }),
    onSuccess: (novo) => queryClient.setQueryData(['termos-status'], novo),
    onError: (erro) => Alert.alert('Não foi possível registrar', erro.message),
  });

  const precisaAceitar = !!data && !data.aceito;
  const aberto = !!data && (precisaAceitar || data.precisaDecidirDadosSensiveis);
  const pronto = (!precisaAceitar || aceito) && (!data?.precisaDecidirDadosSensiveis || sensiveis !== null);

  return (
    <Modal visible={aberto} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: cores.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <T v="titulo">{precisaAceitar ? 'Termos de Uso' : 'Seus dados sensíveis'}</T>
          {precisaAceitar && (
            <>
              <T v="secundario">
                Para continuar usando o app, leia e aceite a versão atual dos Termos de Uso.
              </T>
              <Botao
                titulo={lendo ? 'Esconder os Termos de Uso' : 'Ler os Termos de Uso'}
                variante="contorno"
                icone="description"
                onPress={() => setLendo(!lendo)}
              />
              {lendo && (termos.data ? <Html html={termos.data.content} /> : <Carregando />)}
              <Marcador marcado={aceito} aoMudar={setAceito}>
                Li e aceito os Termos de Uso
              </Marcador>
            </>
          )}
          {data?.precisaDecidirDadosSensiveis && (
            <View style={{ gap: 8 }}>
              <T v="destaque">Dados de saúde e religião</T>
              <T v="secundario">
                A organização usa esses dados para cuidar de você nos eventos (por exemplo, diabetes e
                hipertensão). Você decide se autoriza.
              </T>
              <Marcador redondo marcado={sensiveis === true} aoMudar={() => setSensiveis(true)}>
                Autorizo o uso desses dados
              </Marcador>
              <Marcador redondo marcado={sensiveis === false} aoMudar={() => setSensiveis(false)}>
                Não autorizo — apague esses dados do meu cadastro
              </Marcador>
            </View>
          )}
          <Botao
            titulo="Continuar"
            desabilitado={!pronto}
            carregando={aceitar.isPending}
            onPress={() => aceitar.mutate()}
          />
          <Botao titulo="Sair da conta" variante="texto" onPress={() => sair()} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
