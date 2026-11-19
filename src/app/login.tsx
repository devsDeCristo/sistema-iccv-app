import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';

import { Aviso, Botao, Campo, T, TelaSemCabecalho } from '@/components/ui';
import { api, ErroDaApi } from '@/lib/api';
import { digitos, hora, mascaraCpf } from '@/lib/formato';
import { useSessao } from '@/lib/sessao';

/**
 * Entrar com CPF e senha. Sem login com Google na v1: o servidor só aceita
 * token emitido para o client ID web, o que pede um módulo nativo e build
 * próprio (ver docs/README.md).
 */
export default function Login() {
  const { entrar } = useSessao();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(false);
  const [bloqueadoAte, setBloqueadoAte] = useState<string | null>(null);

  const bloqueado = !!bloqueadoAte && new Date(bloqueadoAte) > new Date();

  const enviar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: { document: digitos(cpf), password: senha },
      });
      await entrar(resposta.access_token);
    } catch (e) {
      const falha = e as ErroDaApi;
      if (falha.status === 404) {
        setErro('Não encontramos um cadastro com este CPF. Crie a sua conta para continuar.');
      } else {
        setErro(falha.message);
        setCaptcha(!!falha.corpo?.captchaRequired);
        setBloqueadoAte(falha.corpo?.bloqueadoAte ?? null);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaSemCabecalho>
      {/* sem a barra escura do topo: a barra de status volta a seguir o tema */}
      <StatusBar style="auto" />
      <View style={{ alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 8 }}>
        <Image source={require('@/assets/images/logo-ic.png')} style={{ width: 90, height: 108 }} contentFit="contain" />
        <T v="titulo">Entrar</T>
        <T v="secundario">Use o CPF e a senha do seu cadastro.</T>
      </View>

      <Campo
        rotulo="CPF"
        value={cpf}
        onChangeText={(t) => setCpf(mascaraCpf(t))}
        keyboardType="number-pad"
        placeholder="000.000.000-00"
        autoComplete="off"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={!verSenha}
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={enviar}
      />
      <Botao
        titulo={verSenha ? 'Esconder a senha' : 'Mostrar a senha'}
        variante="texto"
        icone={verSenha ? 'visibility-off' : 'visibility'}
        onPress={() => setVerSenha(!verSenha)}
      />

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {captcha && (
        <Aviso tipo="alerta">
          Depois de duas senhas erradas, o servidor pede uma verificação que o app ainda não tem. Redefina a
          senha em “Esqueci a senha” ou aguarde 15 minutos.
        </Aviso>
      )}
      {bloqueado && <Aviso tipo="alerta">{`Login bloqueado até ${hora(bloqueadoAte!)}.`}</Aviso>}

      <Botao
        titulo="Entrar"
        carregando={enviando}
        desabilitado={digitos(cpf).length !== 11 || !senha || bloqueado}
        onPress={enviar}
      />
      <Botao titulo="Esqueci a senha" variante="texto" onPress={() => router.push('/esqueci-senha')} />
      <Botao
        titulo="Criar conta"
        variante="contorno"
        onPress={() => router.push({ pathname: '/cadastro', params: { cpf } })}
      />
      <Link href="/termos" style={{ textAlign: 'center', marginTop: 8 }}>
        <T v="secundario">Termos de Uso</T>
      </Link>
    </TelaSemCabecalho>
  );
}
