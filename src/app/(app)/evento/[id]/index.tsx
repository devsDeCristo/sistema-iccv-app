import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { Capa, Selo } from '@/components/cartaz';
import { Html } from '@/components/html';
import { Botao, Cartao, Carregando, Falha, Secao, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useEvento, useMeusGrupos } from '@/lib/consultas';
import { estadoDoGrupo, ocupacao, quadranteAtivo, temDisponivel } from '@/lib/eventos';
import { contagemRegressiva, jaComecou, periodo, preco, quando } from '@/lib/formato';

/** A página do evento: o que é, quando, onde, os ingressos e a loja */
export default function PaginaDoEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cores = useTheme();
  const evento = useEvento(id);
  const grupos = useMeusGrupos();

  if (evento.isPending) return <Carregando />;
  if (evento.isError) return <Falha erro={evento.error} aoTentar={evento.refetch} />;

  const e = evento.data;
  const d = e.data ?? {};
  const doEvento = new Set(e.groupRoles.map((g) => g.id));
  const meusGrupos = (grupos.data?.present ?? []).filter((g) => doEvento.has(g.id));
  const inscrito = meusGrupos.length > 0;
  const verQuadrante = quadranteAtivo(d) && inscrito && jaComecou(e.startDate);
  const produtosAVenda = (e.products ?? []).filter((p) => p.variants.some(temDisponivel));

  const comEstado = e.groupRoles.map((g) => ({ g, estado: estadoDoGrupo(g, e.endDate) }));
  const visiveis = comEstado.filter((x) => x.estado !== 'inativo');
  const abertos = visiveis.filter((x) => x.estado === 'aberto');
  const proximaAbertura = visiveis
    .filter((x) => x.estado === 'agendado' && x.g.opensAt)
    .map((x) => x.g.opensAt!)
    .sort()[0];
  const avisoDeFechado = proximaAbertura
    ? `Inscrições abrem ${quando(proximaAbertura)}`
    : visiveis.length
      ? 'Inscrições encerradas'
      : 'Inscrições em breve';
  const vagas = abertos.reduce((soma, x) => soma + ocupacao(x.g).restantes, 0);
  const contagem = contagemRegressiva(e.startDate, e.endDate);
  const lugar = [d.city, d.state].filter(Boolean).join(' · ') || d.localName || 'Local a definir';
  const endereco = [d.address, d.neighborhood, d.city, d.state, d.zipCode].filter((x) => x?.trim()).join(' · ');
  const temLugar = !!(d.localName || endereco);

  const inscrever = () => router.push(`/evento/${id}/inscricao`);
  const abrirMapa = () => {
    const alvo = d.linkMaps?.trim() || [d.localName, endereco].filter(Boolean).join(', ');
    Linking.openURL(
      /^https?:\/\//i.test(alvo)
        ? alvo
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alvo)}`
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: e.name }} />
      <Tela aoAtualizar={() => (evento.refetch(), grupos.refetch())} atualizando={evento.isRefetching}>
        <Capa url={d.coverUrl} logo={d.logoUrl} altura={220}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {e.type && e.type !== 'OUTRO' && <Selo texto={e.type} />}
            {contagem && <Selo texto={contagem} />}
            {e.status === 'TEST' && <Selo texto="Evento de teste" cor="#A15C00" />}
          </View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{e.name}</Text>
          {d.shortDescription ? (
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>{d.shortDescription}</Text>
          ) : null}
        </Capa>

        <Botao
          titulo={abertos.length ? 'Inscreva-se' : avisoDeFechado}
          icone="how-to-reg"
          desabilitado={!abertos.length}
          onPress={inscrever}
        />
        {verQuadrante && (
          <Botao
            titulo="Quadrante"
            variante="contorno"
            icone="groups"
            onPress={() => router.push(`/evento/${id}/quadrante`)}
          />
        )}
        {produtosAVenda.length > 0 && (
          <Cartao onPress={() => router.push(`/evento/${id}/produtos`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <MaterialIcons name="storefront" size={28} color={cores.primary} />
            <View style={{ flex: 1 }}>
              <T v="destaque">
                {produtosAVenda.length === 1 ? produtosAVenda[0].name : `${produtosAVenda.length} produtos à venda`}
              </T>
              <T v="secundario">
                a partir de {preco(Math.min(...produtosAVenda.map((p) => p.price)))}
              </T>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={cores.textSecondary} />
          </Cartao>
        )}

        <Cartao>
          <Info icone="event" titulo="Quando" valor={periodo(e.startDate, e.endDate, true)} detalhe={contagem ?? undefined} />
          <Info
            icone="place"
            titulo="Onde"
            valor={lugar}
            detalhe={!!d.localName && d.localName !== lugar ? d.localName : undefined}
          />
          <Info
            icone="confirmation-number"
            titulo="Tipos de ingresso"
            valor={
              visiveis.length
                ? `${visiveis.length} ${visiveis.length === 1 ? 'tipo disponível' : 'tipos disponíveis'}`
                : 'Ingressos em breve'
            }
            detalhe={
              !abertos.length
                ? avisoDeFechado
                : d.hideVacancies
                  ? 'Inscrições abertas'
                  : vagas > 0
                    ? 'Vagas disponíveis'
                    : 'Lista de espera'
            }
          />
        </Cartao>

        <Secao titulo="Sobre o evento" />
        {d.description?.trim() ? (
          <Html html={d.description} />
        ) : (
          <T v="secundario">Hmm... ainda não nos contaram sobre este evento.</T>
        )}

        <Secao titulo="Escolha seu ingresso" />
        {visiveis.length === 0 && <T v="secundario">As inscrições deste evento ainda não foram abertas.</T>}
        {visiveis.map(({ g, estado }) => {
          const o = ocupacao(g);
          const aberto = estado === 'aberto';
          return (
            <Cartao key={g.id} onPress={aberto ? inscrever : undefined} style={{ opacity: aberto ? 1 : 0.7 }}>
              <T v="destaque">{g.name}</T>
              <T v="secundario">
                {!aberto
                  ? estado === 'agendado' && g.opensAt
                    ? `Abre ${quando(g.opensAt)}`
                    : 'Encerrado'
                  : d.hideVacancies || g.capacity == null
                    ? 'Inscrições abertas'
                    : o.esgotado
                      ? 'Lista de espera'
                      : `${o.restantes} vagas`}
              </T>
              {aberto && !d.hideVacancies && g.capacity != null && (
                <View style={{ height: 6, borderRadius: 3, backgroundColor: cores.border }}>
                  <View
                    style={{
                      width: `${o.percentual * 100}%`,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: o.esgotado ? cores.warning : cores.success,
                    }}
                  />
                </View>
              )}
            </Cartao>
          );
        })}

        {meusGrupos
          .filter((g) => g.link?.trim())
          .map((g, _, todos) => (
            <Botao
              key={g.id}
              titulo={todos.length === 1 ? 'Entre no grupo do evento' : `Grupo: ${g.name}`}
              variante="contorno"
              icone="chat"
              onPress={() => Linking.openURL(g.link!)}
            />
          ))}

        {temLugar && (
          <>
            <Secao titulo="Como chegar" />
            {!!d.localName && <T v="destaque">{d.localName}</T>}
            {endereco ? <T v="secundario">{endereco}</T> : null}
            <Botao titulo="Abrir no mapa" variante="contorno" icone="map" onPress={abrirMapa} />
          </>
        )}
      </Tela>
    </>
  );
}

function Info({
  icone,
  titulo,
  valor,
  detalhe,
}: {
  icone: React.ComponentProps<typeof MaterialIcons>['name'];
  titulo: string;
  valor: string;
  detalhe?: string;
}) {
  const cores = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 4 }}>
      <MaterialIcons name={icone} size={22} color={cores.primary} />
      <View style={{ flex: 1 }}>
        <T v="pequeno">{titulo}</T>
        <T v="destaque">{valor}</T>
        {!!detalhe && <T v="secundario">{detalhe}</T>}
      </View>
    </View>
  );
}
