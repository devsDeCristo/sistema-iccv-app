import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { QUANTIDADE_MAXIMA_POR_ITEM, temDisponivel } from '@/lib/eventos';
import { moeda } from '@/lib/formato';
import type { Produto } from '@/lib/tipos';

import { Aviso, Botao, Cartao, Chip, T } from './ui';

export type ItemDaSacola = { variantId: string; quantity: number };

/**
 * Os produtos do evento e a sacola. Serve à oferta logo depois da inscrição
 * (o valor entra no pagamento dela) e à loja do evento (pagamento separado).
 */
export function OfertaDeProdutos({
  produtos,
  titulo,
  subtitulo,
  rotuloConfirmar,
  rotuloPular,
  aoConfirmar,
  aoPular,
  carregando,
  bloqueio,
}: {
  produtos: Produto[];
  titulo: string;
  subtitulo: string;
  rotuloConfirmar: string;
  rotuloPular: string;
  aoConfirmar: (itens: ItemDaSacola[]) => void;
  aoPular: () => void;
  carregando?: boolean;
  /** compra não permitida (loja só para inscritos): mostra o motivo no lugar da sacola */
  bloqueio?: string;
}) {
  const cores = useTheme();
  const [sacola, setSacola] = useState<Record<string, number>>({});
  const [escolhendo, setEscolhendo] = useState<Produto | null>(null);

  const variantes = new Map(
    produtos.flatMap((p) => p.variants.map((v) => [v.id, { produto: p, variante: v }] as const))
  );
  const itens = Object.entries(sacola).filter(([, q]) => q > 0);
  const unidades = itens.reduce((s, [, q]) => s + q, 0);
  const total = itens.reduce((s, [id, q]) => s + (variantes.get(id)?.produto.price ?? 0) * q, 0);

  return (
    <View style={{ gap: 12 }}>
      <View>
        <T v="titulo">{titulo}</T>
        <T v="secundario">{subtitulo}</T>
      </View>

      {produtos.map((p) => {
        const escolhidas = p.variants.filter((v) => (sacola[v.id] ?? 0) > 0);
        const esgotado = !p.variants.some(temDisponivel);
        return (
          <Cartao key={p.id}>
            {p.images?.length > 0 && (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {p.images.map((src, i) => (
                  <Image
                    key={i}
                    source={{ uri: src }}
                    style={{ width: 300, height: 200, borderRadius: 10, marginRight: 8 }}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            )}
            <T v="destaque">{p.name}</T>
            <T v="destaque" style={{ color: cores.primary }}>
              {moeda(p.price)}
            </T>
            {p.description ? <T v="secundario">{p.description}</T> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {escolhidas.map((v) => (
                <Chip key={v.id} texto={`${v.name} ×${sacola[v.id]}`} cor={cores.primary} />
              ))}
            </View>
            <Botao
              titulo={esgotado ? 'Esgotado' : escolhidas.length ? 'Alterar escolha' : 'Adicionar à sacola'}
              variante="contorno"
              icone="add-shopping-cart"
              desabilitado={esgotado || carregando || !!bloqueio}
              onPress={() => setEscolhendo(p)}
            />
          </Cartao>
        );
      })}

      {bloqueio ? (
        <>
          <Aviso tipo="alerta">{bloqueio}</Aviso>
          <Botao titulo={rotuloPular} variante="contorno" onPress={aoPular} />
        </>
      ) : (
        <Cartao>
          <T v="destaque">
            {unidades
              ? `${unidades} ${unidades === 1 ? 'item' : 'itens'} na sacola · ${moeda(total)}`
              : 'Sua sacola está vazia'}
          </T>
          <Botao
            titulo={rotuloConfirmar}
            icone="shopping-cart-checkout"
            desabilitado={!unidades}
            carregando={carregando}
            onPress={() => aoConfirmar(itens.map(([variantId, quantity]) => ({ variantId, quantity })))}
          />
          <Botao titulo={rotuloPular} variante="texto" desabilitado={carregando} onPress={aoPular} />
        </Cartao>
      )}

      {escolhendo && (
        <EscolhaDeVariantes
          key={escolhendo.id}
          produto={escolhendo}
          sacola={sacola}
          aoFechar={(novas) => {
            if (novas) setSacola({ ...sacola, ...novas });
            setEscolhendo(null);
          }}
        />
      )}
    </View>
  );
}

/** Tamanhos/cores do produto, com − e + para cada um */
function EscolhaDeVariantes({
  produto,
  sacola,
  aoFechar,
}: {
  produto: Produto;
  sacola: Record<string, number>;
  aoFechar: (novas?: Record<string, number>) => void;
}) {
  const cores = useTheme();
  // começa do que já está na sacola
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() =>
    Object.fromEntries(produto.variants.map((v) => [v.id, sacola[v.id] ?? 0]))
  );

  const unidades = Object.values(quantidades).reduce((s, q) => s + q, 0);

  return (
    <Modal visible animationType="slide" onRequestClose={() => aoFechar()}>
      <SafeAreaView style={{ flex: 1, backgroundColor: cores.background }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <T v="titulo">{produto.name}</T>
          {produto.variants.map((v) => {
            const maximo = Math.min(QUANTIDADE_MAXIMA_POR_ITEM, v.available ?? QUANTIDADE_MAXIMA_POR_ITEM);
            const q = quantidades[v.id] ?? 0;
            const mudar = (n: number) =>
              setQuantidades({ ...quantidades, [v.id]: Math.max(0, Math.min(maximo, n)) });
            return (
              <Cartao key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <T v="destaque">{v.name}</T>
                  {!temDisponivel(v) ? (
                    <T v="pequeno" style={{ color: cores.danger }}>
                      Esgotado
                    </T>
                  ) : v.available != null && v.available <= 5 ? (
                    <T v="pequeno" style={{ color: cores.warning }}>
                      {v.available === 1 ? 'Última unidade' : `Últimas ${v.available}`}
                    </T>
                  ) : null}
                </View>
                <Contador
                  valor={q}
                  aoMenos={() => mudar(q - 1)}
                  aoMais={() => mudar(q + 1)}
                  maxAtingido={q >= maximo || !temDisponivel(v)}
                />
              </Cartao>
            );
          })}
          <T v="destaque">
            {unidades} {unidades === 1 ? 'unidade' : 'unidades'} · {moeda(unidades * (produto.price ?? 0))}
          </T>
          <Botao titulo="Pronto" onPress={() => aoFechar(quantidades)} />
          <Botao titulo="Cancelar" variante="texto" onPress={() => aoFechar()} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Contador({
  valor,
  aoMenos,
  aoMais,
  maxAtingido,
}: {
  valor: number;
  aoMenos: () => void;
  aoMais: () => void;
  maxAtingido: boolean;
}) {
  const cores = useTheme();
  const botao = (icone: 'remove' | 'add', onPress: () => void, desabilitado: boolean, rotulo: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      disabled={desabilitado}
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: cores.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: desabilitado ? 0.35 : 1,
      }}
    >
      <MaterialIcons name={icone} size={20} color={cores.primary} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {botao('remove', aoMenos, valor <= 0, 'Menos um')}
      <T v="destaque" style={{ minWidth: 20, textAlign: 'center' }}>
        {valor}
      </T>
      {botao('add', aoMais, maxAtingido, 'Mais um')}
    </View>
  );
}
