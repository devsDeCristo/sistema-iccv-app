import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { Cartao, T, Tela, type Icone } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useSessao, useUsuario } from '@/lib/sessao';

function Item({ icone, titulo, onPress }: { icone: Icone; titulo: string; onPress: () => void }) {
  const cores = useTheme();
  return (
    <Cartao onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <MaterialIcons name={icone} size={24} color={cores.primary} />
      <T style={{ flex: 1 }}>{titulo}</T>
      <MaterialIcons name="chevron-right" size={22} color={cores.textSecondary} />
    </Cartao>
  );
}

/**
 * Conta e os módulos da igreja de que a pessoa é membro. Solicitações e
 * Oportunidades só aparecem para membro de igreja que tem o módulo no plano.
 */
export default function Mais() {
  const { data: usuario } = useUsuario();
  const { sair } = useSessao();
  const modulos = usuario?.memberChurch?.modulos ?? [];

  return (
    <Tela>
      <View style={{ alignItems: 'center', gap: 6, marginVertical: 8 }}>
        {usuario?.profilePhotoUrl ? (
          <Image source={{ uri: usuario.profilePhotoUrl }} style={{ width: 84, height: 84, borderRadius: 42 }} />
        ) : (
          <MaterialIcons name="account-circle" size={84} color="#9AA3AE" />
        )}
        <T v="subtitulo">{usuario?.fullName}</T>
        <T v="secundario">{usuario?.email}</T>
        {usuario?.memberChurch && <T v="pequeno">Membro da {usuario.memberChurch.name}</T>}
      </View>

      <Item icone="person" titulo="Meu perfil" onPress={() => router.push('/perfil')} />
      <Item icone="notifications" titulo="Avisos" onPress={() => router.push('/notificacoes')} />
      {modulos.includes('REQUESTS') && (
        <Item icone="assignment" titulo="Solicitações" onPress={() => router.push('/solicitacoes')} />
      )}
      {modulos.includes('OPPORTUNITIES') && (
        <Item icone="work" titulo="Oportunidades" onPress={() => router.push('/oportunidades')} />
      )}
      <Item icone="description" titulo="Termos de Uso" onPress={() => router.push('/termos')} />
      <Item
        icone="logout"
        titulo="Sair"
        onPress={() =>
          Alert.alert('Sair da conta?', undefined, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => sair() },
          ])
        }
      />
    </Tela>
  );
}
