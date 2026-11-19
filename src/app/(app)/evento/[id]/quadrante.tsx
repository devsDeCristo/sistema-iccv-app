import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';

import { Botao, Campo, Cartao, Carregando, Chip, Secao, T, Tela, Vazio } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api, baixarPdf } from '@/lib/api';
import { dataDoIso, digitos } from '@/lib/formato';
import type { Quadrante as TipoQuadrante } from '@/lib/tipos';

const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * As equipes do evento com o contato de cada um. O servidor decide quem vê
 * (módulo ligado, evento começado, inscrição paga e termo do menor liberado):
 * cada recusa volta com o motivo.
 */
export default function QuadranteDoEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cores = useTheme();
  const [busca, setBusca] = useState('');
  const [baixando, setBaixando] = useState(false);
  const quadrante = useQuery({
    queryKey: ['quadrante', id],
    queryFn: () => api<TipoQuadrante>(`/events/${id}/quadrante`),
    retry: false,
  });

  if (quadrante.isPending) return <Carregando />;
  if (quadrante.isError) {
    return <Vazio icone="lock-outline" texto={quadrante.error.message || 'O quadrante deste evento não está disponível.'} />;
  }

  const q = quadrante.data;
  const termo = normalizar(busca.trim());
  const soDigitos = digitos(busca);
  const combina = (u: TipoQuadrante['teams'][number]['users'][number]) =>
    !termo ||
    normalizar(u.fullName).includes(termo) ||
    normalizar(u.email ?? '').includes(termo) ||
    (soDigitos.length >= 3 && digitos(u.cellphone ?? '').includes(soDigitos));
  const pessoas = q.teams.reduce((s, t) => s + t.users.length, 0);

  const baixar = async () => {
    setBaixando(true);
    try {
      await baixarPdf(`/events/${id}/quadrante/pdf`, 'quadrante.pdf');
    } catch (erro) {
      Alert.alert('Não foi possível gerar o PDF', (erro as Error).message);
    } finally {
      setBaixando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Quadrante' }} />
      <Tela>
        <T v="subtitulo">{q.event.name}</T>
        <T v="secundario">
          {q.event.periodo ? `${q.event.periodo} · ` : ''}
          {q.teams.length} equipes · {pessoas} pessoas
        </T>
        <Botao titulo="Baixar PDF" variante="contorno" icone="picture-as-pdf" carregando={baixando} onPress={baixar} />
        <Campo
          rotulo="Buscar"
          placeholder="Nome, e-mail ou telefone"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />
        {q.teams.length === 0 && <Vazio icone="groups" texto="Este evento ainda não possui equipes cadastradas." />}
        {q.teams.map((time) => {
          const visiveis = time.users.filter(combina);
          if (!visiveis.length) return null;
          return (
            <View key={time.id} style={{ gap: 10 }}>
              <Secao titulo={time.name} contagem={visiveis.length} />
              {visiveis.map((u) => {
                const fone = digitos(u.cellphone ?? '');
                const celular = fone.length === 11 && fone[2] === '9';
                return (
                  <Cartao key={u.id} style={{ flexDirection: 'row', gap: 12 }}>
                    {u.profilePhotoUrl ? (
                      <Image source={{ uri: u.profilePhotoUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    ) : (
                      <MaterialIcons name="account-circle" size={48} color={cores.textSecondary} />
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <T v="destaque">{u.fullName}</T>
                      {u.roleTeam === 'LEADER' && <Chip texto="Líder" cor={cores.primary} />}
                      {!!u.birthday && <T v="pequeno">Aniversário: {dataDoIso(u.birthday).slice(0, 5)}</T>}
                      <View style={{ flexDirection: 'row', gap: 18, marginTop: 4 }}>
                        {!!fone && <Acao icone="call" rotulo="Ligar" onPress={() => Linking.openURL(`tel:${fone}`)} />}
                        {celular && (
                          <Acao icone="chat" rotulo="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/55${fone}`)} />
                        )}
                        {!!u.email && (
                          <Acao icone="mail-outline" rotulo="E-mail" onPress={() => Linking.openURL(`mailto:${u.email}`)} />
                        )}
                      </View>
                    </View>
                  </Cartao>
                );
              })}
            </View>
          );
        })}
      </Tela>
    </>
  );
}

function Acao({
  icone,
  rotulo,
  onPress,
}: {
  icone: React.ComponentProps<typeof MaterialIcons>['name'];
  rotulo: string;
  onPress: () => void;
}) {
  const cores = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={rotulo} onPress={onPress} hitSlop={8}>
      <MaterialIcons name={icone} size={24} color={cores.primary} />
    </Pressable>
  );
}
