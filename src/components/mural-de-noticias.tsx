import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { dataDaNoticia } from '@/lib/formato';
import type { Noticia } from '@/lib/tipos';

import { CabecalhoDaCaixa, CaixaDoSite } from './caixa-do-site';

/**
 * O mural de notícias do Início, como o `NewsFeed` do site: recado curto, com
 * a imagem, a data e de qual evento (ou igreja) saiu. No site o texto abre num
 * modal; aqui, numa tela.
 */
export function MuralDeNoticias({ noticias }: { noticias?: Noticia[] }) {
  const cores = useTheme();
  return (
    <CaixaDoSite>
      <View style={{ marginBottom: 12 }}>
        <CabecalhoDaCaixa icone="bullhorn-outline" titulo="Notícias" />
      </View>
      {!noticias?.length ? (
        <Text style={{ fontSize: 14, lineHeight: 20, color: cores.textSecondary, paddingVertical: 8 }}>
          Nenhuma notícia por aqui ainda. Os avisos da secretaria aparecem neste espaço.
        </Text>
      ) : (
        noticias.map((n, i) => (
          <View key={n.id}>
            {i > 0 && <View style={{ height: 1, backgroundColor: cores.border, marginVertical: 4 }} />}
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/noticia/${n.id}`)}
              style={({ pressed }) => [
                { flexDirection: 'row', gap: 12, padding: 8, marginHorizontal: -8, borderRadius: 8 },
                pressed && { backgroundColor: cores.background },
              ]}
            >
              {!!n.imageUrl && (
                <Image source={{ uri: n.imageUrl }} style={{ width: 64, height: 64, borderRadius: 8 }} contentFit="cover" />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: cores.textSecondary }}>
                  {dataDaNoticia(n.publishedAt ?? n.createdAt)}
                  {n.event ? ` · ${n.event.name}` : n.church ? ` · ${n.church.name}` : ''}
                </Text>
                <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '600', lineHeight: 20, color: cores.text }}>
                  {n.title}
                </Text>
                {!!n.summary && (
                  <Text numberOfLines={2} style={{ marginTop: 2, fontSize: 13, color: cores.textSecondary }}>
                    {n.summary}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        ))
      )}
    </CaixaDoSite>
  );
}
