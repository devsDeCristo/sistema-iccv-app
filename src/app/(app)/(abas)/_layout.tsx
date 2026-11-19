import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { router, Tabs } from 'expo-router';
import { type ColorValue, Pressable, Text, View } from 'react-native';

import { Marca, useOpcoesDaBarra } from '@/components/barra-do-topo';
import type { Icone } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

const icone =
  (nome: Icone) =>
  function IconeDaAba({ color, size }: { color: ColorValue; size: number }) {
    return <MaterialIcons name={nome} size={size} color={color as string} />;
  };

/** O sininho do topo: avisos não lidos, consultados a cada minuto */
function Sininho() {
  const cores = useTheme();
  const { data } = useQuery({
    queryKey: ['nao-lidas'],
    queryFn: () => api<{ naoLidas: number }>('/notificacoes/nao-lidas'),
    refetchInterval: 60_000,
  });
  const n = data?.naoLidas ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={n ? `Avisos, ${n} não lidos` : 'Avisos'}
      onPress={() => router.push('/notificacoes')}
      hitSlop={10}
      style={{ marginHorizontal: 16 }}
    >
      <MaterialIcons name="notifications-none" size={24} color="#fff" />
      {n > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: cores.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{n > 99 ? '99+' : n}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function Abas() {
  const cores = useTheme();
  const barra = useOpcoesDaBarra();
  return (
    <Tabs
      screenOptions={{
        ...barra,
        tabBarActiveTintColor: cores.primary,
        headerTitle: () => <Marca />,
        headerTitleAlign: 'left',
        headerRight: () => <Sininho />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone('home') }} />
      <Tabs.Screen
        name="inscricoes"
        options={{ title: 'Minhas inscrições', tabBarLabel: 'Inscrições', tabBarIcon: icone('confirmation-number') }}
      />
      <Tabs.Screen name="eventos" options={{ title: 'Eventos', tabBarIcon: icone('event-note') }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais', tabBarIcon: icone('menu') }} />
    </Tabs>
  );
}
