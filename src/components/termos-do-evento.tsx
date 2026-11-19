import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

import { Html } from './html';
import { Botao, Marcador, T } from './ui';

/**
 * Os termos da inscrição do evento: o aceite só libera depois de rolar o texto
 * até o fim (texto curto que não rola já vem liberado), como no web.
 */
export function TermosDoEvento({
  html,
  evento,
  aberto,
  carregando,
  aoCancelar,
  aoAceitar,
}: {
  html: string;
  evento: string;
  aberto: boolean;
  carregando: boolean;
  aoCancelar: () => void;
  aoAceitar: () => void;
}) {
  const cores = useTheme();
  const [liberado, setLiberado] = useState(false);
  const [aceito, setAceito] = useState(false);
  const [altura, setAltura] = useState({ janela: 0, conteudo: 0 });

  const medir = (novo: Partial<typeof altura>) => {
    const m = { ...altura, ...novo };
    setAltura(m);
    if (m.janela && m.conteudo && m.conteudo <= m.janela + 8) setLiberado(true);
  };

  const fechar = () => {
    setLiberado(false);
    setAceito(false);
    aoCancelar();
  };

  return (
    <Modal visible={aberto} animationType="slide" onRequestClose={fechar}>
      <SafeAreaView style={{ flex: 1, backgroundColor: cores.background, padding: 16, gap: 12 }}>
        <View>
          <T v="titulo">Termos da inscrição</T>
          <T v="secundario">{evento}</T>
        </View>
        <ScrollView
          style={{ flex: 1, borderWidth: 1, borderColor: cores.border, borderRadius: 12 }}
          contentContainerStyle={{ padding: 12 }}
          onLayout={(e) => medir({ janela: e.nativeEvent.layout.height })}
          onContentSizeChange={(_, h) => medir({ conteudo: h })}
          scrollEventThrottle={100}
          onScroll={({ nativeEvent: n }) => {
            if (n.layoutMeasurement.height + n.contentOffset.y >= n.contentSize.height - 8) setLiberado(true);
          }}
        >
          <Html html={html} />
        </ScrollView>
        {!liberado && <T v="pequeno">Role o termo até o fim para liberar o aceite.</T>}
        <Marcador marcado={aceito} aoMudar={setAceito} desabilitado={!liberado}>
          Li e aceito todos os termos
        </Marcador>
        <Botao titulo="Prosseguir" desabilitado={!aceito} carregando={carregando} onPress={aoAceitar} />
        <Botao titulo="Cancelar" variante="texto" onPress={fechar} />
      </SafeAreaView>
    </Modal>
  );
}
