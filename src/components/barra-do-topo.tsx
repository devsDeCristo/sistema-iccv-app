import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BARRA } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAvisos } from '@/lib/avisos';
import { iniciais } from '@/lib/formato';
import { useSessao, useUsuario } from '@/lib/sessao';
import { alternarTema } from '@/lib/tema';

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

/** O ☰ que abre o menu lateral, como no site no celular */
export function BotaoDoMenu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir o menu" onPress={onPress} hitSlop={10} style={{ marginLeft: 16, marginRight: 16 }}>
      <MaterialIcons name="menu" size={24} color="#fff" />
    </Pressable>
  );
}

/** O avatar do site: foto, ou as iniciais no círculo cinza */
function Avatar({ nome, foto, tamanho }: { nome?: string; foto?: string | null; tamanho: number }) {
  return (
    <View style={[styles.avatar, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
      {foto ? (
        <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={{ color: '#fff', fontSize: tamanho * 0.4 }}>{iniciais(nome)}</Text>
      )}
    </View>
  );
}

/** O sininho: avisos do app não lidos, consultados a cada minuto */
function Sininho() {
  // só os avisos do app (os do painel da igreja ficam no site), a cada minuto
  const { data } = useAvisos({ refetchInterval: 60_000 });
  const n = data?.filter((aviso) => !aviso.lida).length ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={n ? `Avisos, ${n} não lidos` : 'Avisos'}
      onPress={() => router.push('/notificacoes')}
      hitSlop={6}
      style={styles.botao}
    >
      <MaterialIcons name="notifications-none" size={22} color="#fff" />
      {n > 0 && (
        <View style={styles.contador}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{n > 99 ? '99+' : n}</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * A pastilha de vidro do site, na ponta direita da barra: o sininho, a troca
 * de tema e o avatar, que abre o menu da conta (Meu perfil e Sair).
 */
export function AcoesDaBarra() {
  const escuro = useColorScheme() === 'dark';
  const cores = useTheme();
  const { top } = useSafeAreaInsets();
  const { sair } = useSessao();
  const { data: usuario } = useUsuario();
  const [menu, setMenu] = useState(false);
  const [primeiro, segundo] = (usuario?.fullName ?? '').split(' ');

  const opcao = (icone: React.ComponentProps<typeof MaterialIcons>['name'], titulo: string, onPress: () => void) => (
    <Pressable
      onPress={() => {
        setMenu(false);
        onPress();
      }}
      style={({ pressed }) => [styles.opcao, pressed && { backgroundColor: cores.background }]}
    >
      <MaterialIcons name={icone} size={20} color={cores.textSecondary} />
      <Text style={{ fontSize: 15, color: cores.text }}>{titulo}</Text>
    </Pressable>
  );

  return (
    <View style={styles.pastilha}>
      <Sininho />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
        onPress={() => alternarTema(escuro ? 'dark' : 'light')}
        hitSlop={6}
        style={styles.botao}
      >
        <MaterialIcons name={escuro ? 'light-mode' : 'dark-mode'} size={22} color="#fff" />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Conta" onPress={() => setMenu(true)} style={{ padding: 2, marginLeft: 3 }}>
        <Avatar nome={usuario?.fullName} foto={usuario?.profilePhotoUrl} tamanho={32} />
      </Pressable>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)}>
          <View style={[styles.menu, { top: top + 52, backgroundColor: cores.card }]}>
            <View style={styles.cabecalhoDoMenu}>
              <Avatar nome={usuario?.fullName} foto={usuario?.profilePhotoUrl} tamanho={40} />
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: cores.text }}>
                  {primeiro} {segundo}
                </Text>
                <Text style={{ fontSize: 12.8, color: cores.textSecondary }} numberOfLines={1}>
                  {usuario?.email}
                </Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: cores.border, marginBottom: 4 }} />
            {opcao('account-circle', 'Meu perfil', () => router.push('/perfil'))}
            {opcao('logout', 'Sair', () =>
              Alert.alert('Sair da conta?', undefined, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: () => sair() },
              ])
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pastilha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    paddingLeft: 6,
    marginRight: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  botao: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  contador: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { backgroundColor: '#BDBDBD', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  menu: {
    position: 'absolute',
    right: 12,
    minWidth: 240,
    borderRadius: 12,
    paddingBottom: 4,
    boxShadow: '0px 8px 24px rgba(16,24,40,0.18)',
  },
  cabecalhoDoMenu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
});
