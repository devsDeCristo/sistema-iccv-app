import { Linking, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { lerHtml } from '@/lib/html';

import { T } from './ui';

// ponytail: só texto — cor, tamanho, alinhamento e imagem do editor ficam de fora; usar WebView se precisar
export function Html({ html }: { html: string }) {
  const cores = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {lerHtml(html).map((bloco, i) => {
        const conteudo = bloco.trechos.map((t, j) => (
          <Text
            key={j}
            onPress={t.link ? () => Linking.openURL(t.link!) : undefined}
            style={[
              t.negrito && { fontWeight: '700' },
              t.italico && { fontStyle: 'italic' },
              t.link && { color: cores.primary, textDecorationLine: 'underline' },
            ]}
          >
            {t.texto}
          </Text>
        ));
        if (bloco.tipo === 'li') {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
              <T>{bloco.marcador}</T>
              <T style={{ flex: 1 }}>{conteudo}</T>
            </View>
          );
        }
        return (
          <T key={i} v={bloco.tipo === 'h' ? 'subtitulo' : 'corpo'}>
            {conteudo}
          </T>
        );
      })}
    </View>
  );
}
