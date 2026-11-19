import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/** Uma parada do degradê: posição (0 a 1), cor e opacidade */
export type Parada = [number, string, number];

/** O id do React 19 traz «» e :, que quebram o `url(#…)` do SVG */
export const useIdDoSvg = (prefixo: string) => `${prefixo}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

/**
 * O `linear-gradient(<ângulo>deg, …)` do CSS, cobrindo o pai inteiro. O
 * ângulo segue a regra do CSS: 0 aponta para cima e cresce no sentido horário.
 */
export function Degrade({ angulo, paradas, raio = 0 }: { angulo: number; paradas: Parada[]; raio?: number }) {
  const id = useIdDoSvg('degrade');
  const rad = (angulo * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1={0.5 - dx} y1={0.5 - dy} x2={0.5 + dx} y2={0.5 + dy}>
          {paradas.map(([offset, cor, opacidade], i) => (
            <Stop key={i} offset={offset} stopColor={cor} stopOpacity={opacidade} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" rx={raio} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * O tratamento das capas do site (cartaz, ingresso): o filtro de 38% que
 * assenta a foto e o véu que escurece para a direita, na cor base do tema —
 * a capa fica limpa do lado da logo e fecha do lado do texto.
 */
export function Veu() {
  const cores = useTheme();
  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.38)' }]} pointerEvents="none" />
      <Degrade
        angulo={90}
        paradas={[
          [0.1, cores.veu, 0],
          [0.58, cores.veu, 0.48],
          [1, cores.veu, 0.76],
        ]}
      />
    </>
  );
}
