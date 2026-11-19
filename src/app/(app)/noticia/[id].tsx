import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';

import { Html } from '@/components/html';
import { Carregando, T, Tela, Vazio } from '@/components/ui';
import { useNoticias } from '@/lib/consultas';
import { dataDaNoticia } from '@/lib/formato';

/** A notícia inteira; vem da mesma consulta do mural do Início */
export default function NoticiaAberta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noticias = useNoticias();

  if (noticias.isPending) return <Carregando />;
  const n = noticias.data?.find((x) => x.id === id);
  if (!n) return <Vazio icone="article" texto="Esta notícia não está mais no mural." />;

  return (
    <>
      <Stack.Screen options={{ title: 'Notícia' }} />
      <Tela>
        {!!n.imageUrl && (
          <Image source={{ uri: n.imageUrl }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12 }} contentFit="cover" />
        )}
        <T v="pequeno">
          {[dataDaNoticia(n.publishedAt ?? n.createdAt), n.event?.name ?? n.church?.name, n.author?.fullName]
            .filter(Boolean)
            .join(' · ')}
        </T>
        <T v="titulo">{n.title}</T>
        {n.summary ? <T v="secundario">{n.summary}</T> : null}
        <Html html={n.content} />
      </Tela>
    </>
  );
}
