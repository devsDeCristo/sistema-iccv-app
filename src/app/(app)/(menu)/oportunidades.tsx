import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, View } from 'react-native';

import { Aviso, Botao, Cartao, Carregando, Falha, T, Tela, TituloDaPagina, Vazio } from '@/components/ui';
import { api } from '@/lib/api';
import { data } from '@/lib/formato';
import { queryClient, useUsuario } from '@/lib/sessao';

type Vaga = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string | null;
  createdAt: string;
  interessei: boolean;
};

/** As vagas de emprego da igreja de que a pessoa é membro */
export default function Oportunidades() {
  const { data: usuario } = useUsuario();
  const igreja = usuario?.memberChurch;
  const podeVer = !!igreja?.modulos.includes('OPPORTUNITIES');
  const vagas = useQuery({
    queryKey: ['oportunidades'],
    queryFn: () => api<Vaga[]>('/oportunidades'),
    enabled: podeVer,
  });
  const interesse = useMutation({
    mutationFn: ({ id, quer }: { id: string; quer: boolean }) =>
      api(`/oportunidades/${id}/interesse`, { method: quer ? 'POST' : 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['oportunidades'] }),
    onError: (erro) => Alert.alert('Não foi possível registrar', erro.message),
  });

  const corpo = !podeVer ? (
    <Aviso>
      {igreja
        ? `A ${igreja.name} ainda não divulga oportunidades por aqui.`
        : 'As oportunidades são só para os membros da igreja.'}
    </Aviso>
  ) : vagas.isPending ? (
    <Carregando />
  ) : vagas.isError ? (
    <Falha erro={vagas.error} aoTentar={vagas.refetch} />
  ) : (
    <>
      <Aviso>Ao demonstrar interesse, a igreja repassa seu nome, celular e e-mail a quem oferece a vaga.</Aviso>
      {vagas.data.length === 0 && <Vazio icone="work-outline" texto="Nenhuma vaga aberta no momento." />}
      {vagas.data.map((v) => (
        <Cartao key={v.id}>
          <T v="subtitulo">{v.title}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 }}>
            <T v="destaque">{v.company}</T>
            {v.location ? <T v="secundario">{v.location}</T> : null}
          </View>
          <T v="secundario">{v.description}</T>
          <T v="pequeno">Publicada em {data(v.createdAt)}</T>
          <Botao
            titulo={v.interessei ? 'Retirar interesse' : 'Tenho interesse'}
            variante={v.interessei ? 'contorno' : 'primario'}
            icone={v.interessei ? 'check-circle' : undefined}
            carregando={interesse.isPending && interesse.variables?.id === v.id}
            onPress={() => interesse.mutate({ id: v.id, quer: !v.interessei })}
          />
        </Cartao>
      ))}
    </>
  );

  return (
    <>
      <Tela aoAtualizar={podeVer ? () => vagas.refetch() : undefined} atualizando={vagas.isRefetching}>
        <TituloDaPagina>Oportunidades</TituloDaPagina>
        {corpo}
      </Tela>
    </>
  );
}
