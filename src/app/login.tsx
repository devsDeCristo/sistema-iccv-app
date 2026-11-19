import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CampoDoSite } from '@/components/campo-do-site';
import { Degrade, useIdDoSvg } from '@/components/degrade';
import { Aviso } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { api, ErroDaApi } from '@/lib/api';
import { digitos, hora, mascaraCpf } from '@/lib/formato';
import { useSessao } from '@/lib/sessao';

/** O índigo da marca veste a foto nos dois temas: é acabamento de imagem, não superfície */
const TINTA = '#1C0F4D';

/** A luz morna caindo de cima, como sol de fim de tarde por uma janela */
function LuzDeCima() {
  const id = useIdDoSvg('luz');
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="0%" rx="120%" ry="70%" fx="50%" fy="0%">
          <Stop offset="0" stopColor="#FFD8A8" stopOpacity={0.18} />
          <Stop offset="0.58" stopColor="#FFD8A8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Entrar com CPF e senha, no desenho do login do site no celular: a foto de
 * fundo com o véu índigo, o versículo no alto e o formulário num cartão. Sem
 * login com Google na v1: o servidor só aceita token emitido para o client ID
 * web, o que pede um módulo nativo e build próprio (ver docs/acesso.md).
 */
export default function Login() {
  const cores = useTheme();
  const escuro = useColorScheme() === 'dark';
  const { entrar } = useSessao();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(false);
  const [bloqueio, setBloqueio] = useState<{ mensagem: string; ate: string } | null>(null);

  const bloqueado = !!bloqueio && new Date(bloqueio.ate) > new Date();
  // o botão cheio do site: índigo com texto claro no claro, claro com texto escuro no escuro
  const botao = escuro ? { fundo: '#EBEBEB', texto: '#111B21' } : { fundo: TINTA, texto: '#EBEBEB' };

  const enviar = async () => {
    if (digitos(cpf).length !== 11 || !senha) {
      setErro('Informe o CPF e a senha.');
      return;
    }
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
        setErro('Não encontramos um cadastro com este CPF. Use "Criar cadastro" para continuar.');
      } else {
        setErro(falha.corpo?.bloqueadoAte ? null : falha.message);
        setCaptcha(!!falha.corpo?.captchaRequired);
        setBloqueio(falha.corpo?.bloqueadoAte ? { mensagem: falha.message, ate: falha.corpo.bloqueadoAte } : null);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: TINTA }}>
      {/* a barra de status fica clara sobre a foto escurecida, nos dois temas */}
      <StatusBar style="light" />
      <Image source={require('@/assets/images/capa-padrao.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LuzDeCima />
      <Degrade
        angulo={180}
        paradas={[
          [0, TINTA, 0.5],
          [0.42, TINTA, 0.66],
          [1, TINTA, 0.92],
        ]}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled">
            <View style={styles.banner}>
              <View style={styles.cruz}>
                <View style={styles.bracoDaCruz} />
              </View>
              <Text style={styles.versiculo}>
                “Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens.”
              </Text>
              <Text style={styles.referencia}>COLOSSENSES 3:23</Text>
            </View>

            <View style={styles.coluna}>
              <View
                style={[
                  styles.superficie,
                  {
                    backgroundColor: escuro ? '#1E293B' : '#FFFFFF',
                    boxShadow: escuro ? '0px 24px 50px rgba(0,0,0,0.5)' : '0px 24px 50px rgba(28,15,77,0.28)',
                  },
                ]}
              >
                {/* a marca é a mesma da barra do topo: logo e nome numa linha só */}
                <View style={styles.marca}>
                  <Image
                    source={require('@/assets/images/logo-ic-branco.png')}
                    style={{ width: 26, height: 40 }}
                    contentFit="contain"
                    tintColor={cores.text}
                  />
                  <Text style={[styles.nomeDoSistema, { color: cores.text }]}>
                    ICCV <Text style={{ fontWeight: '400' }}>Eventos</Text>
                  </Text>
                </View>

                <Text style={[styles.titulo, { color: cores.text }]}>Bem-vindo de volta</Text>
                <Text style={[styles.subtitulo, { color: cores.textSecondary }]}>
                  Entre com seu CPF e senha para acompanhar seus eventos e inscrições.
                </Text>

                <View style={{ marginTop: 20, gap: 16 }}>
                  <CampoDoSite
                    rotulo="CPF"
                    obrigatorio
                    value={cpf}
                    onChangeText={(t) => setCpf(mascaraCpf(t))}
                    keyboardType="number-pad"
                    autoComplete="off"
                  />
                  <CampoDoSite
                    rotulo="Senha"
                    obrigatorio
                    senha
                    value={senha}
                    onChangeText={setSenha}
                    autoComplete="current-password"
                    textContentType="password"
                    onSubmitEditing={enviar}
                  />
                </View>

                {!!erro && (
                  <View style={{ marginTop: 16 }}>
                    <Aviso tipo="erro">{erro}</Aviso>
                  </View>
                )}
                {captcha && !bloqueado && (
                  <View style={{ marginTop: 16 }}>
                    <Aviso tipo="alerta">
                      Depois de duas senhas erradas, o servidor pede uma verificação que o app ainda não tem. Use
                      “Esqueci minha senha” ou aguarde 15 minutos.
                    </Aviso>
                  </View>
                )}
                {bloqueado && (
                  <View style={{ marginTop: 16 }}>
                    <Aviso tipo="alerta">
                      {`${bloqueio!.mensagem} Se esqueceu a senha, use "Esqueci minha senha" abaixo. (até ${hora(bloqueio!.ate)})`}
                    </Aviso>
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={enviando || bloqueado}
                  onPress={enviar}
                  style={({ pressed }) => [
                    styles.entrar,
                    { backgroundColor: botao.fundo },
                    (pressed || bloqueado) && { opacity: bloqueado ? 0.45 : 0.8 },
                  ]}
                >
                  {enviando ? (
                    <ActivityIndicator color={botao.texto} />
                  ) : (
                    <Text style={[styles.textoDoEntrar, { color: botao.texto }]}>Entrar</Text>
                  )}
                </Pressable>

                <Pressable onPress={() => router.push('/esqueci-senha')} style={styles.esqueci}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: cores.textSecondary }}>Esqueci minha senha</Text>
                </Pressable>

                <View style={styles.rodape}>
                  <Text style={{ fontSize: 14, color: cores.textSecondary }}>Primeira vez aqui?</Text>
                  <Pressable onPress={() => router.push({ pathname: '/cadastro', params: { cpf } })} hitSlop={8}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: escuro ? cores.primary : TINTA }}>
                      Criar cadastro
                    </Text>
                  </Pressable>
                </View>

                <Text style={[styles.termos, { color: cores.textSecondary }]}>
                  Ao entrar ou criar cadastro, você concorda com os{' '}
                  <Link href="/termos" style={{ fontWeight: '600', color: escuro ? cores.primary : TINTA, textDecorationLine: 'underline' }}>
                    Termos de Uso
                  </Link>
                  .
                </Text>
              </View>

              <Text style={styles.copyright}>
                © 2026 Igreja de Cristo Cidade Verde.{'\n'}Todos os direitos reservados.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rolagem: { flexGrow: 1, justifyContent: 'center' },
  banner: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8, gap: 10 },
  cruz: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.65)' },
  bracoDaCruz: { position: 'absolute', top: 14, left: -9, width: 19, height: 1, backgroundColor: 'rgba(255,255,255,0.65)' },
  versiculo: {
    color: '#FFFFFF',
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 24.8,
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
  referencia: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '500', letterSpacing: 2.5 },
  coluna: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  superficie: { borderRadius: 16, padding: 20 },
  marca: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  nomeDoSistema: { fontSize: 17.6, fontWeight: '700', letterSpacing: -0.18 },
  titulo: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, lineHeight: 32 },
  subtitulo: { fontSize: 14, lineHeight: 22.4, marginTop: 8 },
  entrar: { height: 46, marginTop: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  textoDoEntrar: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  esqueci: { marginTop: 8, height: 40, alignItems: 'center', justifyContent: 'center' },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  termos: { marginTop: 12, fontSize: 12.8, lineHeight: 19.2, textAlign: 'center' },
  copyright: { color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 20.4, textAlign: 'center', marginTop: 20 },
});
