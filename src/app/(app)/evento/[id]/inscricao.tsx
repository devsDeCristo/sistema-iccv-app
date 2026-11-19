import * as DocumentPicker from 'expo-document-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { OfertaDeProdutos, type ItemDaSacola } from '@/components/oferta-de-produtos';
import { TermosDoEvento } from '@/components/termos-do-evento';
import { Aviso, Botao, Cartao, Carregando, Chip, Falha, Marcador, Secao, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { api, arquivoDoForm, compartilharDataUri } from '@/lib/api';
import { useEvento, useMeuCadastro, useMeusGrupos } from '@/lib/consultas';
import { estadoDoGrupo, idadeDoTermo, ocupacao, temDisponivel, temTermo } from '@/lib/eventos';
import { idade, periodo, preco, quando } from '@/lib/formato';
import { AVISO_FORA_DO_SITE, pagar } from '@/lib/pagamento';
import { queryClient, useUsuario } from '@/lib/sessao';

type Passo = 'grupos' | 'ingressos' | 'produtos';

/**
 * Inscrição: escolher os grupos, um ingresso em cada, aceitar os termos do
 * evento (se houver) e, inscrito, a oferta de produtos e o pagamento — o
 * fluxo de `/eventos/:id/inscricao` do web.
 */
export default function Inscricao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cores = useTheme();
  const { data: usuario } = useUsuario();
  const evento = useEvento(id);
  const grupos = useMeusGrupos();
  const cadastro = useMeuCadastro();

  const [passo, setPasso] = useState<Passo>('grupos');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [escolha, setEscolha] = useState<Record<string, string>>({});
  const [avisoLido, setAvisoLido] = useState(false);
  const [termoAssinado, setTermoAssinado] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [lendoTermos, setLendoTermos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [inscritos, setInscritos] = useState<string[]>([]);

  if (evento.isPending || grupos.isPending || cadastro.isPending) return <Carregando />;
  if (evento.isError) return <Falha erro={evento.error} aoTentar={evento.refetch} />;

  const e = evento.data;
  const d = e.data ?? {};
  const nascimento = cadastro.data?.birthday as string | undefined;
  const menor = !!nascimento && !!e.startDate && idade(nascimento, new Date(e.startDate)) < idadeDoTermo(d);
  const exigeTermo = temTermo(d.registrationTerm);
  const recebeOnline = e.church?.chargesOnline ?? e.church?.modulePayment ?? true;
  const produtosAVenda = (e.products ?? []).filter((p) => p.variants.some(temDisponivel));
  const presentes = new Set(grupos.data?.present.map((g) => g.id));
  const naEspera = new Set(grupos.data?.waitlist.map((g) => g.id));
  const escolhidos = e.groupRoles.filter((g) => selecionados.includes(g.id));
  const ingressoDe = (grupoId: string) =>
    e.groupRoles.find((g) => g.id === grupoId)?.roles.find((r) => r.id === escolha[grupoId]);
  const totalDosIngressos = escolhidos.reduce((s, g) => s + (ingressoDe(g.id)?.price ?? 0), 0);
  const tudoEscolhido = escolhidos.length > 0 && escolhidos.every((g) => escolha[g.id]);

  const recarregar = () =>
    Promise.all(
      [['grupos'], ['inscricoes'], ['evento', id]].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    );

  /** Volta à página do evento e, se for o caso, abre o pagamento por cima dela */
  const seguirParaPagamento = (roleIds: string[], paymentIds: string[] = [], pagarAgora = false) => {
    // só o confirmado cobra: ingresso na lista de espera não tem pagamento
    const ingressos = e.groupRoles.flatMap((g) => g.roles);
    const valorConfirmado = roleIds.reduce((s, rid) => s + (ingressos.find((r) => r.id === rid)?.price ?? 0), 0);
    const temValor = paymentIds.length > 0 || valorConfirmado > 0;
    if (!temValor) {
      Alert.alert('Inscrição realizada!', 'Sua inscrição está confirmada.');
      return router.back();
    }
    if (!recebeOnline) {
      Alert.alert('Inscrição realizada!', AVISO_FORA_DO_SITE);
      return router.back();
    }
    const irPagar = () => {
      router.back();
      pagar({ eventId: id, userId: usuario!.id, roleIds, paymentIds });
    };
    if (pagarAgora) return irPagar();
    const algumaNaEspera = roleIds.length < escolhidos.length;
    Alert.alert(
      'Inscrição realizada!',
      algumaNaEspera
        ? 'Algumas inscrições ficaram na lista de espera. Deseja pagar agora as confirmadas?'
        : 'Deseja realizar o pagamento agora? Você também pode pagar depois, em Minhas inscrições.',
      [
        { text: 'Depois', style: 'cancel', onPress: () => router.back() },
        { text: 'Pagar agora', onPress: irPagar },
      ]
    );
  };

  const inscrever = async (aceitouTermos: boolean) => {
    setEnviando(true);
    try {
      const resposta = await api<{ roleId: string; type: 'REGISTERED' | 'WAITLIST' }[]>(
        `/events/${id}/users/${usuario!.id}`,
        {
          method: 'POST',
          body: {
            roleRegistrationId: escolhidos.map((g) => escolha[g.id]),
            ...(aceitouTermos && { acceptedTerms: true }),
          },
        }
      );
      setLendoTermos(false);
      if (menor && termoAssinado) enviarTermoAssinado(termoAssinado);
      await recarregar();

      const confirmados = resposta.filter((r) => r.type === 'REGISTERED').map((r) => r.roleId);
      setInscritos(confirmados);
      if (!confirmados.length) {
        Alert.alert(
          'Inscrição realizada!',
          'No momento suas inscrições ficaram na lista de espera. Você será avisado caso surja vaga.'
        );
        return router.back();
      }
      if (produtosAVenda.length) return setPasso('produtos');
      seguirParaPagamento(confirmados);
    } catch (erro) {
      Alert.alert('Não foi possível fazer a inscrição', (erro as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const enviarTermoAssinado = (arquivo: DocumentPicker.DocumentPickerAsset) => {
    const form = new FormData();
    form.append(
      'termFile',
      arquivoDoForm(arquivo.uri, arquivo.name, arquivo.mimeType ?? 'application/octet-stream')
    );
    api(`/events/${id}/users/${usuario!.id}/guardian-term`, { method: 'POST', body: form })
      .then(recarregar)
      .catch((erro) =>
        Alert.alert('O termo não foi enviado', `${erro.message}\nVocê pode enviar de novo pelo ingresso.`)
      );
  };

  const comprar = async (itens: ItemDaSacola[]) => {
    setEnviando(true);
    try {
      const { paymentId } = await api<{ paymentId: string }>(`/events/${id}/users/${usuario!.id}/products`, {
        method: 'POST',
        body: { items: itens, attachToRegistration: true },
      });
      await recarregar();
      seguirParaPagamento(inscritos, [paymentId], true);
    } catch (erro) {
      evento.refetch();
      Alert.alert('Não foi possível concluir a compra', (erro as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const anexarTermo = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!r.canceled) setTermoAssinado(r.assets[0]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Inscrição',
          // na oferta de produtos a inscrição já foi feita: sai pelos botões
          gestureEnabled: passo !== 'produtos',
          headerBackVisible: passo !== 'produtos',
        }}
      />
      <Tela>
        <View>
          <T v="subtitulo">{e.name}</T>
          <T v="secundario">
            {periodo(e.startDate, e.endDate, true)}
            {d.localName ? ` · ${d.localName}` : ''}
          </T>
        </View>
        <T v="pequeno">
          {passo === 'grupos'
            ? 'Passo 1 · escolha dos grupos'
            : passo === 'ingressos'
              ? 'Passo 2 · escolha dos ingressos'
              : 'Passo 3 · produtos do evento'}
        </T>

        {passo === 'grupos' && (
          <>
            {e.groupRoles.map((g) => {
              const estado = estadoDoGrupo(g, e.endDate);
              const jaInscrito = presentes.has(g.id);
              const esperando = naEspera.has(g.id);
              if (estado === 'inativo' && !jaInscrito && !esperando) return null;
              const o = ocupacao(g);
              const travado = jaInscrito || esperando || estado !== 'aberto';
              const marcado = selecionados.includes(g.id);
              return (
                <Cartao key={g.id}>
                  <Marcador
                    marcado={marcado}
                    desabilitado={travado}
                    aoMudar={() =>
                      setSelecionados(marcado ? selecionados.filter((x) => x !== g.id) : [...selecionados, g.id])
                    }
                  >
                    <T v="destaque">{g.name}</T>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {jaInscrito && <Chip texto="Você já está inscrito" cor={cores.success} />}
                      {esperando && <Chip texto="Na lista de espera" cor={cores.info} />}
                      {!travado && o.esgotado && <Chip texto="Só lista de espera" cor={cores.warning} />}
                      {estado === 'agendado' && g.opensAt && (
                        <Chip texto={`Abre ${quando(g.opensAt)}`} cor={cores.textSecondary} />
                      )}
                      {estado === 'encerrado' && <Chip texto="Inscrições encerradas" cor={cores.textSecondary} />}
                    </View>
                    {!d.hideVacancies && g.capacity != null && g.capacity > 0 && (
                      <T v="pequeno" style={{ marginTop: 4 }}>
                        {o.esgotado
                          ? `Sem vagas — ${g.capacity} lugares ocupados`
                          : `${o.restantes} de ${g.capacity} vagas livres`}
                      </T>
                    )}
                  </Marcador>
                </Cartao>
              );
            })}
            <Botao titulo="Continuar" desabilitado={!selecionados.length} onPress={() => setPasso('ingressos')} />
          </>
        )}

        {passo === 'ingressos' && (
          <>
            {escolhidos.map((g) => (
              <Cartao key={g.id}>
                <T v="destaque">{g.name}</T>
                {g.roles.map((r) => (
                  <Marcador
                    key={r.id}
                    redondo
                    marcado={escolha[g.id] === r.id}
                    aoMudar={() => setEscolha({ ...escolha, [g.id]: r.id })}
                  >
                    <T>{r.description}</T>
                    <T v="secundario">{r.price > 0 ? `${preco(r.price)} por pessoa` : 'Grátis'}</T>
                  </Marcador>
                ))}
              </Cartao>
            ))}

            {menor && (
              <Aviso tipo="alerta">
                <View style={{ gap: 8 }}>
                  <T v="secundario" style={{ color: cores.text }}>
                    Na data do evento você terá menos de {idadeDoTermo(d)} anos: a inscrição só vale com o termo
                    de autorização assinado pelos pais ou responsáveis.
                  </T>
                  {d.minorTermUrl ? (
                    <Botao
                      titulo="1. Baixar o termo"
                      variante="contorno"
                      icone="download"
                      onPress={() =>
                        compartilharDataUri(d.minorTermUrl!, 'termo-de-autorizacao').catch((erro) =>
                          Alert.alert('Não foi possível abrir o termo', erro.message)
                        )
                      }
                    />
                  ) : (
                    <T v="pequeno">Este evento ainda não anexou o modelo. Peça o termo à organização.</T>
                  )}
                  <Botao
                    titulo={termoAssinado ? `Anexado: ${termoAssinado.name}` : '2. Anexar o termo assinado (opcional)'}
                    variante="texto"
                    icone="attach-file"
                    onPress={anexarTermo}
                  />
                  <Marcador marcado={avisoLido} aoMudar={setAvisoLido}>
                    Li o aviso e vou entregar o termo assinado
                  </Marcador>
                </View>
              </Aviso>
            )}

            <Secao titulo="Resumo" />
            <Cartao>
              {escolhidos.map((g) => {
                const r = ingressoDe(g.id);
                return (
                  <View key={g.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <T style={{ flex: 1 }}>
                      {g.name} · {r?.description ?? 'ingresso a escolher'}
                    </T>
                    <T v="destaque">{r ? preco(r.price) : '—'}</T>
                  </View>
                );
              })}
              {tudoEscolhido && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <T v="destaque">Total</T>
                  <T v="destaque">{preco(totalDosIngressos)}</T>
                </View>
              )}
              <T v="pequeno" style={!recebeOnline ? { color: cores.warning } : undefined}>
                {recebeOnline
                  ? 'O pagamento acontece depois de confirmar a inscrição.'
                  : 'Esta igreja não recebe pagamento pelo site: o valor é combinado com a organização.'}
              </T>
            </Cartao>

            <Botao
              titulo="Confirmar inscrição"
              carregando={enviando}
              desabilitado={!tudoEscolhido || (menor && !avisoLido)}
              onPress={() => (exigeTermo ? setLendoTermos(true) : inscrever(false))}
            />
            <Botao titulo="Voltar aos grupos" variante="texto" onPress={() => setPasso('grupos')} />
          </>
        )}

        {passo === 'produtos' && (
          <OfertaDeProdutos
            produtos={produtosAVenda}
            titulo="Inscrição confirmada"
            subtitulo="Leve uma lembrança do evento. O valor entra no mesmo pagamento da inscrição."
            rotuloConfirmar={recebeOnline ? 'Finalizar compra' : 'Confirmar compra'}
            rotuloPular="Não, obrigado"
            carregando={enviando}
            aoConfirmar={comprar}
            aoPular={() => seguirParaPagamento(inscritos)}
          />
        )}
      </Tela>

      {exigeTermo && (
        <TermosDoEvento
          html={d.registrationTerm!}
          evento={e.name}
          aberto={lendoTermos}
          carregando={enviando}
          aoCancelar={() => setLendoTermos(false)}
          aoAceitar={() => inscrever(true)}
        />
      )}
    </>
  );
}
