import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export type Icone = ComponentProps<typeof MaterialIcons>['name'];

type Variante = 'titulo' | 'subtitulo' | 'corpo' | 'secundario' | 'pequeno' | 'destaque';

/** Texto do app nas variantes de sempre, já na cor do tema */
export function T({ v = 'corpo', style, ...props }: TextProps & { v?: Variante }) {
  const cores = useTheme();
  return (
    <Text
      {...props}
      style={[
        estilosDeTexto[v],
        { color: v === 'secundario' || v === 'pequeno' ? cores.textSecondary : cores.text },
        style,
      ]}
    />
  );
}

const estilosDeTexto = StyleSheet.create({
  titulo: { fontSize: 22, fontWeight: '700' },
  subtitulo: { fontSize: 17, fontWeight: '700' },
  destaque: { fontSize: 15, fontWeight: '600' },
  corpo: { fontSize: 15, lineHeight: 21 },
  secundario: { fontSize: 14, lineHeight: 19 },
  pequeno: { fontSize: 12 },
});

/** A tela rolável padrão, com puxar para atualizar quando há `aoAtualizar` */
export function Tela({
  children,
  aoAtualizar,
  atualizando = false,
  semMargemDeCima,
}: {
  children: ReactNode;
  aoAtualizar?: () => void;
  atualizando?: boolean;
  semMargemDeCima?: boolean;
}) {
  const cores = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: cores.background }}
      contentContainerStyle={[styles.tela, semMargemDeCima && { paddingTop: 0 }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} /> : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

/** Tela sem cabeçalho de navegação (login, cadastro), respeitando o entalhe */
export function TelaSemCabecalho({ children }: { children: ReactNode }) {
  const cores = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.background }}>
      <Tela>{children}</Tela>
    </SafeAreaView>
  );
}

export function Cartao({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const cores = useTheme();
  const base = [styles.cartao, { backgroundColor: cores.card, borderColor: cores.border }, style];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  ) : (
    <View style={base}>{children}</View>
  );
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando,
  desabilitado,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'contorno' | 'texto' | 'perigo';
  icone?: Icone;
  carregando?: boolean;
  desabilitado?: boolean;
}) {
  const cores = useTheme();
  const cor = variante === 'perigo' ? cores.danger : cores.primary;
  const cheio = variante === 'primario' || variante === 'perigo';
  const corDoTexto = cheio ? cores.onPrimary : cor;
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        cheio && { backgroundColor: cor },
        variante === 'contorno' && { borderWidth: 1.5, borderColor: cor },
        (inativo || pressed) && { opacity: inativo ? 0.45 : 0.75 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corDoTexto} />
      ) : (
        <>
          {icone && <MaterialIcons name={icone} size={20} color={corDoTexto} />}
          <Text style={[styles.textoDoBotao, { color: corDoTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({
  rotulo,
  erro,
  ajuda,
  obrigatorio,
  ...props
}: TextInputProps & { rotulo: string; erro?: string; ajuda?: string; obrigatorio?: boolean }) {
  const cores = useTheme();
  return (
    <View style={styles.campo}>
      <T v="destaque">
        {rotulo}
        {obrigatorio && <Text style={{ color: cores.danger }}> *</Text>}
      </T>
      <TextInput
        placeholderTextColor={cores.textSecondary}
        {...props}
        style={[
          styles.entrada,
          {
            color: cores.text,
            backgroundColor: props.editable === false ? cores.background : cores.card,
            borderColor: erro ? cores.danger : cores.border,
          },
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
        ]}
      />
      {erro ? (
        <T v="pequeno" style={{ color: cores.danger }}>
          {erro}
        </T>
      ) : ajuda ? (
        <T v="pequeno">{ajuda}</T>
      ) : null}
    </View>
  );
}

/** O `select` do app: abre a lista numa folha e devolve o valor escolhido */
export function Seletor<V extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  obrigatorio,
  erro,
  placeholder = 'Escolha',
}: {
  rotulo: string;
  valor: V | '';
  opcoes: { valor: V; rotulo: string }[];
  aoMudar: (v: V) => void;
  obrigatorio?: boolean;
  erro?: string;
  placeholder?: string;
}) {
  const cores = useTheme();
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.valor === valor);
  return (
    <View style={styles.campo}>
      <T v="destaque">
        {rotulo}
        {obrigatorio && <Text style={{ color: cores.danger }}> *</Text>}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${atual?.rotulo ?? placeholder}`}
        onPress={() => setAberto(true)}
        style={[
          styles.entrada,
          styles.linha,
          { backgroundColor: cores.card, borderColor: erro ? cores.danger : cores.border },
        ]}
      >
        <T style={{ flex: 1, color: atual ? cores.text : cores.textSecondary }}>
          {atual?.rotulo ?? placeholder}
        </T>
        <MaterialIcons name="expand-more" size={22} color={cores.textSecondary} />
      </Pressable>
      {erro && (
        <T v="pequeno" style={{ color: cores.danger }}>
          {erro}
        </T>
      )}
      <Modal visible={aberto} animationType="slide" transparent onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundoDaFolha} onPress={() => setAberto(false)}>
          <View style={[styles.folha, { backgroundColor: cores.card }]}>
            <T v="subtitulo" style={{ padding: 16 }}>
              {rotulo}
            </T>
            <FlatList
              data={opcoes}
              keyExtractor={(o) => o.valor}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    aoMudar(item.valor);
                    setAberto(false);
                  }}
                  style={[styles.opcao, { borderTopColor: cores.border }]}
                >
                  <T style={{ flex: 1 }}>{item.rotulo}</T>
                  {item.valor === valor && <MaterialIcons name="check" size={20} color={cores.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Caixa de marcar (checkbox) ou bolinha (`redondo`), com o texto clicável */
export function Marcador({
  marcado,
  aoMudar,
  children,
  redondo,
  desabilitado,
}: {
  marcado: boolean;
  aoMudar: (v: boolean) => void;
  children: ReactNode;
  redondo?: boolean;
  desabilitado?: boolean;
}) {
  const cores = useTheme();
  const icone: Icone = redondo
    ? marcado
      ? 'radio-button-checked'
      : 'radio-button-unchecked'
    : marcado
      ? 'check-box'
      : 'check-box-outline-blank';
  return (
    <Pressable
      accessibilityRole={redondo ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: marcado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={() => aoMudar(!marcado)}
      style={[styles.linha, { gap: 10, opacity: desabilitado ? 0.45 : 1, paddingVertical: 4 }]}
    >
      <MaterialIcons name={icone} size={24} color={marcado ? cores.primary : cores.textSecondary} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <T>{children}</T> : children}</View>
    </Pressable>
  );
}

/** O `CustomChip` do site: texto na cor, fundo a 10% e borda a 28% dela */
export function Chip({ texto, cor, icone }: { texto: string; cor: string; icone?: Icone }) {
  return (
    <View style={[styles.chip, { backgroundColor: cor + '1A', borderColor: cor + '47' }]}>
      {icone && <MaterialIcons name={icone} size={16} color={cor} />}
      <Text style={{ color: cor, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}

export function Aviso({
  children,
  tipo = 'info',
}: {
  children: ReactNode;
  tipo?: 'info' | 'alerta' | 'erro' | 'sucesso';
}) {
  const cores = useTheme();
  const cor = { info: cores.info, alerta: cores.warning, erro: cores.danger, sucesso: cores.success }[tipo];
  const icone: Icone = { info: 'info-outline', alerta: 'warning-amber', erro: 'error-outline', sucesso: 'check-circle-outline' }[tipo] as Icone;
  return (
    <View style={[styles.aviso, { backgroundColor: cor + '18', borderColor: cor + '55' }]}>
      <MaterialIcons name={icone} size={20} color={cor} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <T v="secundario" style={{ color: cores.text }}>{children}</T> : children}</View>
    </View>
  );
}

export function Carregando() {
  const cores = useTheme();
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={cores.primary} />
    </View>
  );
}

export function Vazio({ icone, texto, children }: { icone: Icone; texto: string; children?: ReactNode }) {
  const cores = useTheme();
  return (
    <View style={styles.centro}>
      <MaterialIcons name={icone} size={44} color={cores.textSecondary} />
      <T v="secundario" style={{ textAlign: 'center' }}>
        {texto}
      </T>
      {children}
    </View>
  );
}

/** Erro de carregamento com "Tentar de novo" */
export function Falha({ erro, aoTentar }: { erro: unknown; aoTentar: () => void }) {
  return (
    <Vazio icone="cloud-off" texto={(erro as Error)?.message ?? 'Não foi possível carregar.'}>
      <Botao titulo="Tentar de novo" variante="contorno" onPress={aoTentar} />
    </Vazio>
  );
}

/** O título de página do site (o `Header` no celular: 20px, peso 500) */
export function TituloDaPagina({ children }: { children: string }) {
  const cores = useTheme();
  return <Text style={{ fontSize: 20, fontWeight: '500', lineHeight: 24, color: cores.text }}>{children}</Text>;
}

/** Título de seção, com a contagem opcional */
export function Secao({ titulo, contagem }: { titulo: string; contagem?: number }) {
  return (
    <View style={[styles.linha, { gap: 8, marginTop: 8 }]}>
      <T v="subtitulo">{titulo}</T>
      {contagem != null && <T v="secundario">({contagem})</T>}
    </View>
  );
}

export const styles = StyleSheet.create({
  tela: { padding: 16, gap: 14, paddingBottom: 40 },
  cartao: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  botao: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textoDoBotao: { fontSize: 16, fontWeight: '600' },
  campo: { gap: 6 },
  entrada: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  linha: { flexDirection: 'row', alignItems: 'center' },
  // o chip pequeno do MUI: 24 de altura, pílula, 8 de respiro
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    height: 24,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  aviso: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  centro: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 40 },
  fundoDaFolha: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  folha: { maxHeight: '70%', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 24 },
  opcao: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
