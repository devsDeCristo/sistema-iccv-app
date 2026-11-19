import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Agenda } from '@/components/agenda';
import { BoasVindas } from '@/components/boas-vindas';
import { CaixaDoSite, IconeDoVazio } from '@/components/caixa-do-site';
import { CartaoDoIngresso } from '@/components/cartao-do-ingresso';
import { CartazDoEvento } from '@/components/cartaz';
import { FiltroDeIgreja, TODAS_AS_IGREJAS } from '@/components/filtro-de-igreja';
import { MuralDeNoticias } from '@/components/mural-de-noticias';
import { Carregando, Falha, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { situacaoPorEvento, useEventos, useInscricoes, useMeusGrupos, useNoticias } from '@/lib/consultas';
import { emAndamento, jaAcabou } from '@/lib/formato';
import { preferencia } from '@/lib/preferencias';
import { useUsuario } from '@/lib/sessao';

const CHAVE_DA_IGREJA = 'home_igreja';

/** O título de seção do site, com "N eventos" à direita */
function TituloSecao({ titulo, quantidade }: { titulo: string; quantidade?: number }) {
  const cores = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
      <Text style={{ fontSize: 17, fontWeight: '600', color: cores.text }}>{titulo}</Text>
      {quantidade !== undefined && (
        <Text style={{ fontSize: 13, color: cores.textSecondary }}>
          {quantidade === 1 ? '1 evento' : `${quantidade} eventos`}
        </Text>
      )}
    </View>
  );
}

/** Um vazio do site: ícone redondo tingido, título, texto e, se houver, a saída */
function Vazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: 'ticket-confirmation-outline' | 'calendar-check-outline';
  titulo: string;
  texto: string;
  acao?: { rotulo: string; onPress: () => void };
}) {
  const cores = useTheme();
  return (
    <CaixaDoSite centro>
      <IconeDoVazio icone={icone} tamanho={acao ? 52 : 44} />
      <Text style={{ fontSize: 15, fontWeight: '600', color: cores.text, textAlign: 'center' }}>{titulo}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: cores.textSecondary, textAlign: 'center' }}>
        {texto}
      </Text>
      {acao && (
        <Pressable
          onPress={acao.onPress}
          style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: cores.primary + '80',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: cores.primary }}>{acao.rotulo}</Text>
        </Pressable>
      )}
    </CaixaDoSite>
  );
}

/**
 * O Início, como a `/home` do site no celular: boas-vindas, os ingressos
 * ativos, os eventos abertos (acontecendo agora e próximos), a agenda e as
 * notícias. O filtro de igreja vale para os ingressos e os eventos, e a
 * escolha fica guardada no aparelho, como no site.
 */
export default function Inicio() {
  const { data: usuario } = useUsuario();
  const eventos = useEventos();
  const grupos = useMeusGrupos();
  const inscricoes = useInscricoes();
  const noticias = useNoticias();
  const [igreja, setIgreja] = useState(TODAS_AS_IGREJAS);

  useEffect(() => {
    preferencia.ler(CHAVE_DA_IGREJA).then((salva) => salva && setIgreja(salva));
  }, []);
  const escolherIgreja = (id: string) => {
    setIgreja(id);
    preferencia.gravar(CHAVE_DA_IGREJA, id);
  };

  const atualizar = () => {
    eventos.refetch();
    grupos.refetch();
    inscricoes.refetch();
    noticias.refetch();
  };

  if (eventos.isPending) return <Carregando />;
  if (eventos.isError) return <Falha erro={eventos.error} aoTentar={atualizar} />;

  const abertos = eventos.data
    .filter((e) => (e.status === 'ACTIVE' || e.status === 'TEST') && !jaAcabou(e.endDate))
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
  const igrejas = [
    ...new Map(
      eventos.data
        .filter((e) => e.church && (e.church.status ?? 'ACTIVE') === 'ACTIVE')
        .map((e) => [e.church!.id, { id: e.church!.id, nome: e.church!.name }])
    ).values(),
  ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  // igreja salva que saiu do catálogo vale como "todas" até alguém escolher de novo
  const filtro = igrejas.some((i) => i.id === igreja) ? igreja : TODAS_AS_IGREJAS;
  const nomeDoFiltro = igrejas.find((i) => i.id === filtro)?.nome;
  const daIgreja = (churchId?: string) => filtro === TODAS_AS_IGREJAS || churchId === filtro;
  const contagem: Record<string, number> = { [TODAS_AS_IGREJAS]: abertos.length };
  for (const e of abertos) if (e.church) contagem[e.church.id] = (contagem[e.church.id] ?? 0) + 1;

  const visiveis = abertos.filter((e) => daIgreja(e.church?.id));
  const acontecendo = visiveis.filter((e) => emAndamento(e.startDate, e.endDate));
  const proximos = visiveis.filter((e) => !acontecendo.includes(e));
  const situacao = situacaoPorEvento(grupos.data);

  const catalogo = new Map(eventos.data.map((e) => [e.id, e]));
  const ingressos = (inscricoes.data ?? [])
    .filter((i) => {
      const e = catalogo.get(i.eventId);
      return e && !jaAcabou(e.endDate) && daIgreja(e.church?.id);
    })
    .sort((a, b) =>
      (catalogo.get(a.eventId)?.startDate ?? '').localeCompare(catalogo.get(b.eventId)?.startDate ?? '')
    );

  return (
    <Tela aoAtualizar={atualizar} atualizando={eventos.isRefetching}>
      <BoasVindas nomeCompleto={usuario?.fullName} foto={usuario?.profilePhotoUrl} />

      {igrejas.length > 1 && (
        <View style={{ alignItems: 'flex-end' }}>
          <FiltroDeIgreja igrejas={igrejas} valor={filtro} contagem={contagem} aoMudar={escolherIgreja} />
        </View>
      )}

      <TituloSecao titulo="Meus Ingressos Ativos" />
      {ingressos.length > 0
        ? ingressos.map((i) => (
            <CartaoDoIngresso key={i.eventId} inscricao={i} evento={catalogo.get(i.eventId)} compacto />
          ))
        : !inscricoes.isPending && (
            <Vazio
              icone="ticket-confirmation-outline"
              titulo={nomeDoFiltro ? `Nenhum ingresso ativo em ${nomeDoFiltro}` : 'Nenhum ingresso ativo'}
              texto={
                nomeDoFiltro
                  ? 'Ingressos de eventos de outras igrejas aparecem em "Todas as igrejas".'
                  : 'Quando você se inscrever em um evento que vem por aí, o ingresso aparece aqui.'
              }
            />
          )}

      {acontecendo.length > 0 && (
        <>
          <TituloSecao titulo="Acontecendo agora" quantidade={acontecendo.length} />
          {acontecendo.map((e) => (
            <CartazDoEvento key={e.id} evento={e} situacao={situacao.get(e.id)} proximo />
          ))}
        </>
      )}
      {(proximos.length > 0 || acontecendo.length === 0) && (
        <TituloSecao titulo="Próximos eventos" quantidade={proximos.length || undefined} />
      )}
      {proximos.map((e) => (
        <CartazDoEvento key={e.id} evento={e} situacao={situacao.get(e.id)} />
      ))}
      {visiveis.length === 0 && (
        <Vazio
          icone="calendar-check-outline"
          titulo={nomeDoFiltro ? `Nenhum evento aberto em ${nomeDoFiltro}` : 'Nenhum evento com inscrições abertas'}
          texto={
            nomeDoFiltro
              ? 'Outras igrejas podem estar com inscrições abertas agora.'
              : 'Assim que um evento novo abrir, ele aparece aqui. Enquanto isso, você pode acompanhar suas inscrições e pagamentos.'
          }
          acao={
            nomeDoFiltro
              ? { rotulo: 'Ver todas as igrejas', onPress: () => escolherIgreja(TODAS_AS_IGREJAS) }
              : { rotulo: 'Ver minhas inscrições', onPress: () => router.navigate('/inscricoes') }
          }
        />
      )}

      <View style={{ height: 8 }} />
      <Agenda eventos={eventos.data} grupos={grupos.data} />
      <MuralDeNoticias noticias={noticias.data} />
    </Tela>
  );
}
