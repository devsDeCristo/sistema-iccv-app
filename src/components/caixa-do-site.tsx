import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * O `Paper` do site (raio 12, superfície `paper`, sombra leve): a caixa da
 * agenda, das notícias e dos vazios do Início.
 */
export function CaixaDoSite({ children, centro }: { children: ReactNode; centro?: boolean }) {
  const cores = useTheme();
  return (
    <View style={[styles.caixa, { backgroundColor: cores.card }, centro && { alignItems: 'center' }]}>
      {children}
    </View>
  );
}

/** O cabeçalho das caixas do Início: o ícone num quadrado tingido e o título */
export function CabecalhoDaCaixa({
  icone,
  titulo,
}: {
  icone: ComponentProps<typeof MaterialCommunityIcons>['name'];
  titulo: string;
}) {
  const cores = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={[styles.quadrado, { backgroundColor: cores.primary + '1F' }]}>
        <MaterialCommunityIcons name={icone} size={18} color={cores.primary} />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '600', color: cores.text }}>{titulo}</Text>
    </View>
  );
}

/** O ícone redondo tingido dos vazios do site */
export function IconeDoVazio({
  icone,
  tamanho = 52,
}: {
  icone: ComponentProps<typeof MaterialCommunityIcons>['name'];
  tamanho?: number;
}) {
  const cores = useTheme();
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cores.primary + '1A',
        marginBottom: 8,
      }}
    >
      <MaterialCommunityIcons name={icone} size={tamanho / 2} color={cores.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px 2px rgba(16,24,40,0.06), 0px 4px 10px rgba(16,24,40,0.06)',
  },
  quadrado: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
