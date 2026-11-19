import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { FormularioDoCadastro } from '@/components/formulario-do-cadastro';
import { Aviso, Botao, Campo, Marcador, Secao, Seletor, T, Tela } from '@/components/ui';
import { CADASTRO_VAZIO, corpoDoCadastro, validarCadastro } from '@/lib/cadastro';
import { api, ErroDaApi } from '@/lib/api';
import { mascaraCpf } from '@/lib/formato';
import { useSessao } from '@/lib/sessao';

const OUTRA = 'outra';

/** Criar a conta (`POST /users`); a resposta já traz o token da sessão */
export default function Cadastro() {
  const { entrar } = useSessao();
  const params = useLocalSearchParams<{ cpf?: string }>();
  const [dados, setDados] = useState({ ...CADASTRO_VAZIO, cpf: mascaraCpf(params.cpf ?? '') });
  const [igreja, setIgreja] = useState('');
  const [outraIgreja, setOutraIgreja] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [termos, setTermos] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const igrejas = useQuery({
    queryKey: ['igrejas-publicas'],
    queryFn: () => api<{ id: string; name: string }[]>('/public/churches'),
  });

  const erros = {
    ...validarCadastro(dados),
    ...(!igreja && { igreja: 'Escolha a sua igreja, ou "Outra" com o nome dela' }),
    ...(igreja === OUTRA && !outraIgreja.trim() && { outraIgreja: 'Informe o nome da sua igreja' }),
    ...((senha.length < 8 || senha.length > 72) && { senha: 'De 8 a 72 caracteres' }),
    ...(confirmacao !== senha && { confirmacao: 'As senhas não são iguais' }),
  };
  const valido = Object.keys(erros).length === 0 && termos;

  const enviar = async () => {
    setMostrarErros(true);
    if (!valido) {
      setErro(termos ? 'Confira os campos marcados.' : 'Aceite os Termos de Uso para criar a conta.');
      return;
    }
    setErro(null);
    setEnviando(true);
    const nomeDaIgreja =
      igreja === OUTRA ? outraIgreja.trim() : igrejas.data?.find((i) => i.id === igreja)?.name;
    try {
      const resposta = await api<{ access_token: string }>('/users', {
        method: 'POST',
        body: {
          ...corpoDoCadastro(dados),
          password: senha,
          worker: true,
          acceptedTerms: true,
          ...(dados.consentimento && { sensitiveDataConsent: true }),
          congregation: nomeDaIgreja,
          ...(igreja === OUTRA ? { otherChurchName: outraIgreja.trim() } : { requestedChurchId: igreja }),
        },
      });
      await entrar(resposta.access_token);
    } catch (e) {
      setErro((e as ErroDaApi).message);
    } finally {
      setEnviando(false);
    }
  };

  const errosVisiveis = mostrarErros ? erros : {};

  return (
    <Tela>
      <FormularioDoCadastro dados={dados} aoMudar={setDados} erros={errosVisiveis} />

      <Secao titulo="Sua igreja" />
      <Seletor
        rotulo="Igreja"
        obrigatorio
        valor={igreja}
        opcoes={[
          ...(igrejas.data ?? []).map((i) => ({ valor: i.id, rotulo: i.name })),
          { valor: OUTRA, rotulo: 'Outra' },
        ]}
        aoMudar={setIgreja}
        erro={errosVisiveis.igreja}
        placeholder={igrejas.isPending ? 'Carregando…' : 'Escolha'}
      />
      {igreja === OUTRA && (
        <Campo
          rotulo="Nome da sua igreja"
          obrigatorio
          maxLength={120}
          value={outraIgreja}
          onChangeText={setOutraIgreja}
          erro={errosVisiveis.outraIgreja}
        />
      )}
      <T v="pequeno">A igreja confirma se você é membro dela; até lá, fica como pedido.</T>

      <Secao titulo="Senha" />
      <Campo
        rotulo="Senha"
        obrigatorio
        secureTextEntry
        autoComplete="new-password"
        value={senha}
        onChangeText={setSenha}
        erro={errosVisiveis.senha}
        ajuda="De 8 a 72 caracteres."
      />
      <Campo
        rotulo="Repita a senha"
        obrigatorio
        secureTextEntry
        value={confirmacao}
        onChangeText={setConfirmacao}
        erro={errosVisiveis.confirmacao}
      />

      <Marcador marcado={termos} aoMudar={setTermos}>
        <T>
          Li e aceito os{' '}
          <Link href="/termos">
            <T style={{ textDecorationLine: 'underline', fontWeight: '600' }}>Termos de Uso</T>
          </Link>
          . Se este cadastro for de menor de idade, declaro ser o responsável legal por ele.
        </T>
      </Marcador>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Botao titulo="Criar conta" carregando={enviando} onPress={enviar} />
    </Tela>
  );
}
