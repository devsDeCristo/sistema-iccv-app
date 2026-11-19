import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { BARRA } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** A marca da barra do topo do site: o logo branco e "ICCV Eventos" */
export function Marca() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image source={require('@/assets/images/logo-ic-branco.png')} style={{ width: 25, height: 38 }} contentFit="contain" />
      <Text style={{ color: '#fff', fontSize: 16.8, fontWeight: '700', letterSpacing: -0.17 }}>
        ICCV <Text style={{ fontWeight: '400', color: 'rgba(255,255,255,0.78)' }}>Eventos</Text>
      </Text>
    </View>
  );
}

/**
 * As opções de cabeçalho que dão a cara da barra do site: cor chapada da
 * marca, o fio claro embaixo no lugar da sombra e texto e ícones em branco.
 */
export function useOpcoesDaBarra() {
  const fundo = BARRA[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return {
    headerTintColor: '#fff',
    headerShadowVisible: false,
    headerBackground: () => (
      <View style={{ flex: 1, backgroundColor: fundo, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }} />
    ),
  };
}
