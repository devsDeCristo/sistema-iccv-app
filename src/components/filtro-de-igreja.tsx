import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export const TODAS_AS_IGREJAS = 'todas';

/**
 * De qual igreja a pessoa quer ver evento, como o `FiltroDeIgreja` do site:
 * uma pastilha que mostra o recorte atual (e se pinta de primária com filtro
 * ligado) e abre a lista com busca e, à direita, quantos eventos abertos cada
 * igreja tem. Só aparece com mais de uma igreja.
 */
export function FiltroDeIgreja({
  igrejas,
  valor,
  contagem,
  aoMudar,
}: {
  igrejas: { id: string; nome: string }[];
  valor: string;
  contagem: Record<string, number>;
  aoMudar: (id: string) => void;
}) {
  const cores = useTheme();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const escolhida = igrejas.find((i) => i.id === valor);
  const termo = busca.trim().toLowerCase();
  const visiveis = termo ? igrejas.filter((i) => i.nome.toLowerCase().includes(termo)) : igrejas;

  const escolher = (id: string) => {
    aoMudar(id);
    setAberto(false);
    setBusca('');
  };

  const opcao = (id: string, nome: string) => {
    const marcada = id === valor || (id === TODAS_AS_IGREJAS && !escolhida);
    return (
      <Pressable
        key={id}
        onPress={() => escolher(id)}
        style={[styles.opcao, marcada && { backgroundColor: cores.primary + '1A' }]}
      >
        <MaterialIcons name="check" size={17} color={marcada ? cores.primary : 'transparent'} />
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontSize: 14, fontWeight: marcada ? '600' : '400', color: marcada ? cores.primary : cores.text }}
        >
          {nome}
        </Text>
        {(contagem[id] ?? 0) > 0 && <Text style={{ fontSize: 12, color: cores.textSecondary }}>{contagem[id]}</Text>}
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Igreja: ${escolhida?.nome ?? 'Todas as igrejas'}`}
        onPress={() => setAberto(true)}
        style={[
          styles.pastilha,
          escolhida
            ? { borderColor: cores.primary + '66', backgroundColor: cores.primary + '1A' }
            : { borderColor: cores.border, backgroundColor: cores.card },
        ]}
      >
        <MaterialCommunityIcons name="church-outline" size={17} color={escolhida ? cores.primary : cores.textSecondary} />
        <Text
          numberOfLines={1}
          style={{ flexShrink: 1, fontSize: 13, fontWeight: '600', color: escolhida ? cores.primary : cores.textSecondary }}
        >
          {escolhida?.nome ?? 'Todas as igrejas'}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={escolhida ? cores.primary : cores.textSecondary} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="slide" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={[styles.folha, { backgroundColor: cores.card }]}>
            <View style={[styles.busca, { borderColor: cores.border }]}>
              <MaterialIcons name="search" size={18} color={cores.textSecondary} />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar igreja"
                placeholderTextColor={cores.textSecondary}
                style={{ flex: 1, fontSize: 14, color: cores.text, paddingVertical: 8 }}
              />
            </View>
            <View style={{ height: 1, backgroundColor: cores.border }} />
            <FlatList
              data={visiveis}
              keyExtractor={(i) => i.id}
              ListHeaderComponent={opcao(TODAS_AS_IGREJAS, 'Todas as igrejas')}
              renderItem={({ item }) => opcao(item.id, item.nome)}
              ListEmptyComponent={
                <Text style={{ padding: 12, fontSize: 13, color: cores.textSecondary }}>Nenhuma igreja com esse nome.</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pastilha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 260,
    paddingHorizontal: 12,
    paddingVertical: 5.6,
    borderRadius: 999,
    borderWidth: 1,
  },
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  folha: { maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, paddingTop: 4 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 10, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
});
