import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AZUL_VIVO, VIOLETA_VIVO } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { contagemRegressiva, periodo } from '@/lib/formato';
import type { EventoDoCatalogo } from '@/lib/tipos';

import { Degrade, Veu } from './degrade';

const CAPA_PADRAO = require('@/assets/images/capa-padrao.jpg');

/** Capa do evento com véu escuro: texto branco legível sobre qualquer foto */
export function Capa({
  url,
  logo,
  altura = 170,
  children,
}: {
  url?: string;
  logo?: string;
  altura?: number;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.capa, { height: altura }]}>
      <Image source={url ? { uri: url } : CAPA_PADRAO} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      <View style={styles.conteudo}>
        {!!logo && <Image source={{ uri: logo }} style={styles.logo} contentFit="contain" />}
        {children}
      </View>
    </View>
  );
}

/**
 * O selo de vidro do site, do tamanho de uma etiqueta. `cor` tinge o vidro
 * quando o selo fala de uma situação (inscrito, lista de espera, teste); sem
 * ela é o vidro branco neutro (tipo do evento, contagem regressiva).
 */
export function Selo({ texto, cor }: { texto: string; cor?: string }) {
  return (
    <View
      style={[
        styles.selo,
        cor
          ? { backgroundColor: cor + '57', borderColor: cor + '99' }
          : { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' },
      ]}
    >
      <Text style={styles.textoDoSelo}>{texto.toUpperCase()}</Text>
    </View>
  );
}

/** Uma informação curta com ícone, escrita por cima da capa */
function Meta({ icone, children }: { icone: React.ComponentProps<typeof MaterialCommunityIcons>['name']; children: string }) {
  return (
    <View style={styles.meta}>
      <MaterialCommunityIcons name={icone} size={15} color="rgba(255,255,255,0.75)" />
      <Text style={styles.textoDaMeta} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Um evento como um cartaz pequeno, como o `CartazDoEvento` do site: a capa
 * de fundo com o véu, a logo à esquerda, os selos e o nome, e no rodapé
 * quando e onde, com o botão. `proximo` é o destaque (acontecendo agora):
 * nome um pouco maior e o botão no degradê da ação principal.
 */
export function CartazDoEvento({
  evento,
  situacao,
  proximo,
}: {
  evento: EventoDoCatalogo;
  situacao?: 'inscrito' | 'espera';
  proximo?: boolean;
}) {
  const cores = useTheme();
  const contagem = contagemRegressiva(evento.startDate, evento.endDate);
  const logo = evento.data?.logoUrl;
  const abrir = () => router.push(`/evento/${evento.id}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${evento.name}, ${periodo(evento.startDate, evento.endDate)}`}
      onPress={abrir}
      style={({ pressed }) => [styles.cartaz, pressed && { opacity: 0.92 }]}
    >
      <Image
        source={evento.data?.coverUrl ? { uri: evento.data.coverUrl } : CAPA_PADRAO}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <Veu />

      <View style={styles.conteudoDoCartaz}>
        <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
          {!!logo && (
            <View style={{ justifyContent: 'center' }}>
              <Image
                source={{ uri: logo }}
                style={[{ width: 88, height: proximo ? 64 : 56 }, styles.sombraDaLogo]}
                contentFit="contain"
              />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            <View style={styles.selos}>
              {!!evento.type && evento.type !== 'OUTRO' && <Selo texto={evento.type} />}
              {!!contagem && <Selo texto={contagem} />}
              {evento.status === 'TEST' && <Selo texto="Teste" cor={cores.chips.alert} />}
              {!!situacao && (
                <Selo
                  texto={situacao === 'inscrito' ? 'Inscrito' : 'Lista de espera'}
                  cor={situacao === 'inscrito' ? cores.chips.success : cores.chips.info}
                />
              )}
            </View>
            <Text style={[styles.nome, { fontSize: proximo ? 16 : 15.2 }]} numberOfLines={2}>
              {evento.name}
            </Text>
          </View>
        </View>

        {/* no celular o rodapé atravessa o cartaz por baixo da logo, e o botão
            desce para a linha de baixo, encostado à direita */}
        <View style={{ gap: 6 }}>
          <View style={{ gap: 2 }}>
            <Meta icone="calendar-month-outline">{periodo(evento.startDate, evento.endDate)}</Meta>
            {!!evento.data?.localName && <Meta icone="map-marker-outline">{evento.data.localName}</Meta>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.botao, !proximo && styles.botaoDeVidro, proximo && styles.sombraDoBotao]}>
              {proximo && (
                <Degrade
                  angulo={120}
                  raio={15}
                  paradas={[
                    [0, AZUL_VIVO, 1],
                    [1, VIOLETA_VIVO, 1],
                  ]}
                />
              )}
              <Text style={styles.textoDoBotao}>{situacao ? 'Ver meu evento' : 'Ver detalhes'}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  capa: { borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  conteudo: { padding: 14, gap: 4 },
  logo: { width: 56, height: 56, marginBottom: 4 },
  cartaz: { minHeight: 132, borderRadius: 12, overflow: 'hidden' },
  conteudoDoCartaz: { flex: 1, padding: 12, paddingBottom: 14, gap: 8 },
  sombraDaLogo: { filter: 'drop-shadow(0px 3px 10px rgba(0,0,0,0.55))' },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  selo: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2.4 },
  textoDoSelo: { color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.63 },
  nome: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.15,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  textoDaMeta: {
    flexShrink: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  botao: { height: 30, paddingHorizontal: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  botaoDeVidro: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(0,0,0,0.25)' },
  sombraDoBotao: { boxShadow: '0px 8px 24px -6px rgba(255,255,255,0.45)' },
  textoDoBotao: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
