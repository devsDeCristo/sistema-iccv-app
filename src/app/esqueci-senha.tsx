import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Aviso, Botao, Campo, T, Tela } from '@/components/ui';
import { api, ErroDaApi } from '@/lib/api';
import { digitos, mascaraCpf } from '@/lib/formato';

type Passo = 'cpf' | 'codigo' | 'senha';

/**
 * Os três passos do servidor: pedir o código (vai para o e-mail do cadastro),
 * conferir o código (devolve um ticket de 15 min) e gravar a senha nova.
 */
export default function EsqueciSenha() {
  const [passo, setPasso] = useState<Passo>('cpf');
  const [cpf, setCpf] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ticket, setTicket] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera(espera - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const chamar = async (fn: () => Promise<void>) => {
    setErro(null);
    setEnviando(true);
    try {
      await fn();
    } catch (e) {
      const falha = e as ErroDaApi;
      // o ticket venceu: recomeça do CPF, como no web
      if (falha.status === 401) setPasso('cpf');
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  };

  const pedirCodigo = () =>
    chamar(async () => {
      const r = await api<{ message: string }>('/auth/password/forgot', {
        method: 'POST',
        body: { document: digitos(cpf) },
      });
      setAviso(r.message);
      setEspera(60);
      setPasso('codigo');
    });

  const conferir = () =>
    chamar(async () => {
      const r = await api<{ ticket: string }>('/auth/password/verify-code', {
        method: 'POST',
        body: { document: digitos(cpf), code: codigo },
      });
      setTicket(r.ticket);
      setPasso('senha');
    });

  const redefinir = () =>
    chamar(async () => {
      const r = await api<{ message: string }>('/auth/password/reset', {
        method: 'POST',
        body: { ticket, password: senha },
      });
      Alert.alert('Senha redefinida', r.message);
      router.back();
    });

  return (
    <Tela>
      {passo === 'cpf' && (
        <>
          <T v="secundario">Informe o CPF do cadastro. Enviamos um código de 8 dígitos para o seu e-mail.</T>
          <Campo
            rotulo="CPF"
            value={cpf}
            onChangeText={(t) => setCpf(mascaraCpf(t))}
            keyboardType="number-pad"
          />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao
            titulo="Enviar código"
            carregando={enviando}
            desabilitado={digitos(cpf).length !== 11}
            onPress={pedirCodigo}
          />
        </>
      )}
      {passo === 'codigo' && (
        <>
          {aviso && <Aviso>{aviso}</Aviso>}
          <Campo
            rotulo="Código"
            value={codigo}
            onChangeText={(t) => setCodigo(digitos(t).slice(0, 8))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao titulo="Conferir" carregando={enviando} desabilitado={codigo.length !== 8} onPress={conferir} />
          <Botao
            titulo={espera > 0 ? `Reenviar código em ${espera}s` : 'Reenviar código'}
            variante="texto"
            desabilitado={espera > 0 || enviando}
            onPress={pedirCodigo}
          />
        </>
      )}
      {passo === 'senha' && (
        <>
          <Campo
            rotulo="Nova senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="new-password"
            ajuda="De 8 a 72 caracteres."
          />
          <Campo
            rotulo="Repita a nova senha"
            value={confirmacao}
            onChangeText={setConfirmacao}
            secureTextEntry
            erro={confirmacao && confirmacao !== senha ? 'As senhas não são iguais' : undefined}
          />
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Botao
            titulo="Salvar a nova senha"
            carregando={enviando}
            desabilitado={senha.length < 8 || senha.length > 72 || senha !== confirmacao}
            onPress={redefinir}
          />
        </>
      )}
    </Tela>
  );
}
