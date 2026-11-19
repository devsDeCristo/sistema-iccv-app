import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaskedViewOriginal from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AZUL_VIVO, VIOLETA_VIVO } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { iniciais, primeiroNome, saudacao } from '@/lib/formato';

import { Degrade, useIdDoSvg } from './degrade';

// o pacote declara um componente de classe no formato antigo, que os tipos do React 19 recusam
const MaskedView = MaskedViewOriginal as unknown as ComponentType<{
  maskElement: ReactElement;
  children: ReactNode;
}>;

/** Uma luz redonda (degradê radial que some a 70%), como as do site */
function Luz({ tamanho, cor, opacidade, posicao }: {
  tamanho: number;
  cor: string;
  opacidade: number;
  posicao: { top?: number; bottom?: number; left?: number; right?: number };
}) {
  const id = useIdDoSvg('luz');
  return (
    <Svg width={tamanho} height={tamanho} style={[{ position: 'absolute' }, posicao]} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={cor} stopOpacity={opacidade} />
          <Stop offset="0.7" stopColor={cor} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={tamanho / 2} cy={tamanho / 2} r={tamanho / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Listras finas na diagonal, quase invisíveis: a textura de superfície impressa */
function Textura({ cor, opacidade }: { cor: string; opacidade: number }) {
  const id = useIdDoSvg('listra');
  return (
    <Svg style={[StyleSheet.absoluteFill, { opacity: opacidade }]} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern id={id} width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <Line x1={1} y1={0} x2={1} y2={12} stroke={cor} strokeOpacity={0.03} strokeWidth={2} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** O nome com o degradê recortado no texto (`background-clip: text` do site) */
function NomeEmCor({ nome, estilo }: { nome: string; estilo: object }) {
  // o navegador (prévia `npm run web`) não recorta: lá o nome fica no azul
  if (Platform.OS === 'web') return <Text style={[estilo, { color: AZUL_VIVO }]}>{nome}</Text>;
  return (
    <MaskedView maskElement={<Text style={estilo}>{nome}</Text>}>
      <Text style={[estilo, { opacity: 0 }]}>{nome}</Text>
      <Degrade
        angulo={120}
        paradas={[
          [0, AZUL_VIVO, 1],
          [1, VIOLETA_VIVO, 1],
        ]}
      />
    </MaskedView>
  );
}

/**
 * A faixa de boas-vindas do Início, como o `WelcomeHero` do site: só
 * acolhimento — a foto, o nome e a recepção da casa — e o atalho para as
 * inscrições. No escuro tudo entra por volta da metade da intensidade, para a
 * faixa tingir em vez de acender.
 */
export function BoasVindas({ nomeCompleto, foto }: { nomeCompleto?: string; foto?: string | null }) {
  const cores = useTheme();
  const escuro = useColorScheme() === 'dark';
  const corDoTom = escuro ? cores.primary : AZUL_VIVO;
  const nome = primeiroNome(nomeCompleto);

  return (
    <View
      style={[
        styles.faixa,
        {
          backgroundColor: cores.card,
          borderColor: corDoTom + (escuro ? '29' : '2E'),
          boxShadow: `0px 18px 40px -28px ${AZUL_VIVO}${escuro ? '73' : '99'}`,
        },
      ]}
    >
      <Degrade
        angulo={115}
        paradas={[
          [0, AZUL_VIVO, escuro ? 0.16 : 0.2],
          [0.42, VIOLETA_VIVO, escuro ? 0.1 : 0.14],
          [0.78, VIOLETA_VIVO, 0],
        ]}
      />
      <Luz tamanho={300} cor={corDoTom} opacidade={escuro ? 0.16 : 0.26} posicao={{ top: -140, right: -80 }} />
      <Luz tamanho={260} cor={VIOLETA_VIVO} opacidade={escuro ? 0.12 : 0.18} posicao={{ bottom: -160, left: -60 }} />
      <Textura cor={cores.text} opacidade={escuro ? 0.5 : 0.7} />

      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, minWidth: 0 }}>
          {/* o anel de cor destaca a foto sem moldura dura em volta dela */}
          <View style={[styles.anel, { boxShadow: `0px 8px 20px -10px ${AZUL_VIVO}${escuro ? '73' : 'E6'}` }]}>
            <Degrade
              angulo={135}
              raio={26}
              paradas={[
                [0, AZUL_VIVO, 1],
                [1, VIOLETA_VIVO, 1],
              ]}
            />
            <View style={[styles.avatar, { borderColor: cores.card }]}>
              {foto ? (
                <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 18 }}>{iniciais(nomeCompleto)}</Text>
              )}
            </View>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Text style={[styles.saudacao, { color: cores.text }]}>
                {saudacao()}
                {nome ? ', ' : ''}
              </Text>
              {!!nome && <NomeEmCor nome={nome} estilo={styles.saudacao} />}
              <Text style={[styles.saudacao, { color: cores.text }]}>!</Text>
            </View>
            <Text style={{ marginTop: 2, fontSize: 14, lineHeight: 20, color: cores.textSecondary }}>
              É um prazer receber você novamente! Abaixo você pode ver os dados dos eventos.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/inscricoes')}
          style={({ pressed }) => [
            styles.botao,
            { boxShadow: `0px 12px 28px -12px ${AZUL_VIVO}${escuro ? '80' : 'F2'}` },
            pressed && { transform: [{ scale: 1.035 }] },
          ]}
        >
          <Degrade
            angulo={120}
            raio={19}
            paradas={[
              [0, AZUL_VIVO, 1],
              [1, VIOLETA_VIVO, 1],
            ]}
          />
          <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color="#fff" />
          <Text style={styles.textoDoBotao}>Minhas inscrições</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: { borderRadius: 12, borderWidth: 1, padding: 16, overflow: 'hidden' },
  anel: { width: 52, height: 52, borderRadius: 26, padding: 3 },
  avatar: {
    flex: 1,
    borderRadius: 23,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BDBDBD',
  },
  saudacao: { fontSize: 19, fontWeight: '700', letterSpacing: -0.38, lineHeight: 22 },
  botao: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textoDoBotao: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
