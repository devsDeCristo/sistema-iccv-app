import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Botao, Campo, Cartao, Secao, Seletor, T, Tela } from '@/components/ui';
import { api } from '@/lib/api';
import { queryClient, useUsuario } from '@/lib/sessao';

/** A mesma lista da API (`MINISTERIOS` em `solicitacoes.dto.ts`) */
const MINISTERIOS = [
  'Louvor',
  'Mídia',
  'Som e iluminação',
  'Infantil',
  'Jovens',
  'Recepção',
  'Intercessão',
  'Ação social',
  'Diaconia',
  'Ensino',
  'Casais',
  'Outro',
];
const MAX_PRODUTOS = 20;
const PRODUTO_VAZIO = { nome: '', quantidade: '1', link: '' };
const quantidadeValida = (q: string) => /^\d{1,3}$/.test(q) && Number(q) >= 1;
const linkValido = (l: string) => !l.trim() || /^https?:\/\/\S+$/i.test(l.trim());

/** Pedir à igreja de que é membro: a igreja não se escolhe, a API decide */
export default function NovaSolicitacao() {
  const { data: usuario } = useUsuario();
  const [ministerio, setMinisterio] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [produtos, setProdutos] = useState([PRODUTO_VAZIO]);
  const [enviando, setEnviando] = useState(false);

  const pronto =
    !!ministerio &&
    !!titulo.trim() &&
    !!descricao.trim() &&
    produtos.every((p) => p.nome.trim() && quantidadeValida(p.quantidade) && linkValido(p.link));

  const mudar = (i: number, campo: keyof typeof PRODUTO_VAZIO, valor: string) =>
    setProdutos(produtos.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)));

  const enviar = async () => {
    setEnviando(true);
    try {
      await api('/solicitacoes', {
        method: 'POST',
        body: {
          ministerio,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          produtos: produtos.map((p) => ({
            nome: p.nome.trim(),
            quantidade: Number(p.quantidade),
            ...(p.link.trim() && { link: p.link.trim() }),
          })),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['solicitacoes'] });
      Alert.alert('Solicitação enviada');
      router.back();
    } catch (erro) {
      Alert.alert('Não foi possível enviar', (erro as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nova solicitação', presentation: 'modal' }} />
      <Tela>
        <T v="secundario">O pedido vai para a {usuario?.memberChurch?.name}.</T>
        <Seletor
          rotulo="Ministério"
          obrigatorio
          valor={ministerio}
          opcoes={MINISTERIOS.map((m) => ({ valor: m, rotulo: m }))}
          aoMudar={setMinisterio}
        />
        <Campo rotulo="O que está pedindo" obrigatorio maxLength={120} value={titulo} onChangeText={setTitulo} />
        <Campo
          rotulo="Por que precisa"
          obrigatorio
          multiline
          maxLength={2000}
          value={descricao}
          onChangeText={setDescricao}
        />

        <Secao titulo="Produtos" contagem={produtos.length} />
        {produtos.map((p, i) => (
          <Cartao key={i}>
            <Campo rotulo="Nome" obrigatorio maxLength={120} value={p.nome} onChangeText={(v) => mudar(i, 'nome', v)} />
            <Campo
              rotulo="Quantidade"
              obrigatorio
              keyboardType="number-pad"
              value={p.quantidade}
              onChangeText={(v) => mudar(i, 'quantidade', v.replace(/\D/g, '').slice(0, 3))}
              erro={quantidadeValida(p.quantidade) ? undefined : 'De 1 a 999'}
            />
            <Campo
              rotulo="Link da loja (opcional)"
              keyboardType="url"
              autoCapitalize="none"
              maxLength={500}
              value={p.link}
              onChangeText={(v) => mudar(i, 'link', v)}
              erro={linkValido(p.link) ? undefined : 'O link precisa começar com http:// ou https://'}
            />
            {produtos.length > 1 && (
              <View style={{ alignItems: 'flex-end' }}>
                <Botao
                  titulo="Tirar produto"
                  variante="texto"
                  icone="delete-outline"
                  onPress={() => setProdutos(produtos.filter((_, j) => j !== i))}
                />
              </View>
            )}
          </Cartao>
        ))}
        {produtos.length < MAX_PRODUTOS && (
          <Botao
            titulo="Adicionar produto"
            variante="contorno"
            icone="add"
            onPress={() => setProdutos([...produtos, PRODUTO_VAZIO])}
          />
        )}
        <Botao titulo="Enviar" desabilitado={!pronto} carregando={enviando} onPress={enviar} />
      </Tela>
    </>
  );
}
