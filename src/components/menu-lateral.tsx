import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaskedViewOriginal from '@react-native-masked-view/masked-view';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import type { ComponentProps, ComponentType, ReactElement, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AZUL_VIVO, VIOLETA_VIVO } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useUsuario } from '@/lib/sessao';

import { Degrade } from './degrade';

// o pacote declara um componente de classe no formato antigo, que os tipos do React 19 recusam
const MaskedView = MaskedViewOriginal as unknown as ComponentType<{ maskElement: ReactElement; children: ReactNode }>;

type Item = {
  link: string;
  icone: ComponentProps<typeof MaterialIcons>['name'];
  titulo: string;
  novo?: boolean;
  /** a cor de destaque do módulo, como no site (`CORES_DO_MODULO`): claro e escuro */
  corDoModulo?: [string, string];
};

/** "NOVO!" com o degradê do par de cores vivas recortado na letra; no escuro, clareado */
function Novo() {
  const escuro = useColorScheme() === 'dark';
  const [de, ate] = escuro ? ['#719AF2', '#AA7FF3'] : [AZUL_VIVO, VIOLETA_VIVO];
  const texto = <Text style={styles.novo}>NOVO!</Text>;
  if (Platform.OS === 'web') return <Text style={[styles.novo, { color: de }]}>NOVO!</Text>;
  return (
    <MaskedView maskElement={texto}>
      <Text style={[styles.novo, { opacity: 0 }]}>NOVO!</Text>
      <Degrade
        angulo={90}
        paradas={[
          [0, de, 1],
          [1, ate, 1],
        ]}
      />
    </MaskedView>
  );
}

/**
 * O menu lateral, como a gaveta do site no celular: a marca no topo e a seção
 * "Inscrições" com os mesmos itens e regras da régua do site — Solicitações e
 * Oportunidades só para quem é membro de igreja com o módulo no plano. O
 * selecionado é pintado por fundo esmaecido e texto na cor de destaque.
 */
export function MenuLateral({ navigation }: DrawerContentComponentProps) {
  const cores = useTheme();
  const escuro = useColorScheme() === 'dark';
  const caminho = usePathname();
  const { data: usuario } = useUsuario();
  const modulos = usuario?.memberChurch?.modulos ?? [];

  const itens: Item[] = [
    { link: '/', icone: 'event', titulo: 'Página Inicial' },
    { link: '/inscricoes', icone: 'confirmation-number', titulo: 'Minhas Inscrições' },
    { link: '/eventos', icone: 'event-note', titulo: 'Eventos' },
    ...(modulos.includes('REQUESTS')
      ? [{ link: '/solicitacoes', icone: 'assignment', titulo: 'Solicitações', corDoModulo: ['#9A294A', '#E997A5'] } as Item]
      : []),
    ...(modulos.includes('OPPORTUNITIES')
      ? [{ link: '/oportunidades', icone: 'work', titulo: 'Oportunidades', novo: true, corDoModulo: ['#8A3A00', '#F2B07C'] } as Item]
      : []),
  ];

  const ir = (link: string) => {
    navigation.closeDrawer();
    router.navigate(link as never);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: cores.card }}>
      {/* a marca aparece só aqui: na barra do topo ela já está */}
      <Pressable accessibilityRole="link" onPress={() => ir('/')} style={styles.marca}>
        <Image
          source={require('@/assets/images/logo-ic-branco.png')}
          style={{ width: 24, height: 36 }}
          contentFit="contain"
          tintColor={cores.text}
        />
        <Text style={{ fontSize: 15, fontWeight: '700', color: cores.text }}>
          ICCV <Text style={{ fontWeight: '400', color: cores.textSecondary }}>Eventos</Text>
        </Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingVertical: 24 }}>
        <Text style={[styles.tituloDaSecao, { color: escuro ? '#495C67' : '#696A6A' }]}>INSCRIÇÕES</Text>
        <View style={{ paddingHorizontal: 12 }}>
          {itens.map((item) => {
            const ativo = item.link === '/' ? caminho === '/' : caminho === item.link || caminho.startsWith(`${item.link}/`);
            // a primária do tema (no escuro, a variante clara) ou a do módulo da tela
            const destaque = item.corDoModulo ? item.corDoModulo[escuro ? 1 : 0] : escuro ? '#5182EF' : cores.primary;
            const cor = ativo ? destaque : cores.textSecondary;
            return (
              <Pressable
                key={item.link}
                accessibilityRole="link"
                accessibilityState={{ selected: ativo }}
                onPress={() => ir(item.link)}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: ativo ? destaque + (pressed ? '2E' : '1A') : pressed ? cores.background : 'transparent' },
                ]}
              >
                <MaterialIcons name={item.icone} size={22} color={cor} />
                <View style={styles.linhaDoItem}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: ativo ? '600' : '500', color: cor }}>
                    {item.titulo}
                  </Text>
                  {item.novo && <Novo />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 24 },
  tituloDaSecao: { fontSize: 11, fontWeight: '700', letterSpacing: 0.77, paddingLeft: 20, paddingRight: 16, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 44, paddingHorizontal: 16, marginBottom: 4, borderRadius: 8 },
  linhaDoItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  novo: { fontSize: 12, fontWeight: '800', letterSpacing: 0.96, lineHeight: 14 },
});
