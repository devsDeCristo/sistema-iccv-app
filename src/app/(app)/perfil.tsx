import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { FormularioDoCadastro } from '@/components/formulario-do-cadastro';
import { Aviso, Botao, Campo, Carregando, Falha, Secao, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { corpoDoCadastro, dadosDoUsuario, validarCadastro, type DadosDoCadastro } from '@/lib/cadastro';
import { api, arquivoDoForm } from '@/lib/api';
import { useMeuCadastro } from '@/lib/consultas';
import { queryClient, useUsuario } from '@/lib/sessao';

const recarregar = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['me'] }),
    queryClient.invalidateQueries({ queryKey: ['usuario'] }),
  ]);

/** Foto, dados do cadastro e senha de quem está logado */
export default function Perfil() {
  const cores = useTheme();
  const { data: usuario } = useUsuario();
  const cadastro = useMeuCadastro();
  const [dados, setDados] = useState<DadosDoCadastro | null>(null);
  const [senhaParaEmail, setSenhaParaEmail] = useState('');
  const [mostrarErros, setMostrarErros] = useState(false);
  const [ocupado, setOcupado] = useState<'foto' | 'dados' | 'senha' | null>(null);
  const [senha, setSenha] = useState({ atual: '', nova: '', repetida: '' });

  if (cadastro.isPending) return <Carregando />;
  if (cadastro.isError) return <Falha erro={cadastro.error} aoTentar={cadastro.refetch} />;

  const original = dadosDoUsuario(cadastro.data);
  const atual = dados ?? original;
  const trocouEmail = atual.email.trim().toLowerCase() !== original.email.trim().toLowerCase();
  const erros = validarCadastro(atual);

  const trocarFoto = async (camera: boolean) => {
    const permissao = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return Alert.alert('Sem permissão', 'Libere o acesso nas configurações do celular.');
    const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
    const r = camera ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (r.canceled) return;
    const foto = r.assets[0];
    const tipo = foto.mimeType ?? 'image/jpeg';
    const form = new FormData();
    // nome único: o servidor grava a foto pelo nome do arquivo, e "image.jpg" de duas pessoas colidiria
    form.append('photo', arquivoDoForm(foto.uri, `${usuario!.id}-${Date.now()}.${tipo.split('/')[1]}`, tipo));
    setOcupado('foto');
    try {
      await api('/users/me/profile-photo', { method: 'POST', body: form });
      await recarregar();
    } catch (erro) {
      Alert.alert('Não foi possível trocar a foto', (erro as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const salvar = async () => {
    setMostrarErros(true);
    if (Object.keys(erros).length) return Alert.alert('Confira os campos marcados');
    if (trocouEmail && !senhaParaEmail) return Alert.alert('Para trocar o e-mail, confirme a sua senha atual');
    setOcupado('dados');
    try {
      await api('/users/me', {
        method: 'PUT',
        body: {
          ...corpoDoCadastro(atual),
          congregation: atual.congregation.trim() || undefined,
          ...(atual.consentimento !== original.consentimento && { sensitiveDataConsent: atual.consentimento }),
          ...(trocouEmail && { currentPassword: senhaParaEmail }),
        },
      });
      await recarregar();
      setDados(null);
      setSenhaParaEmail('');
      Alert.alert('Dados salvos');
    } catch (erro) {
      Alert.alert('Não foi possível salvar', (erro as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const trocarSenha = async () => {
    setOcupado('senha');
    try {
      const r = await api<{ message: string }>('/auth/password/change', {
        method: 'POST',
        body: { currentPassword: senha.atual, password: senha.nova },
      });
      setSenha({ atual: '', nova: '', repetida: '' });
      Alert.alert('Senha alterada', r.message);
    } catch (erro) {
      Alert.alert('Não foi possível trocar a senha', (erro as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Meu perfil' }} />
      <Tela>
        <View style={{ alignItems: 'center', gap: 8 }}>
          {cadastro.data.profilePhotoUrl ? (
            <Image source={{ uri: cadastro.data.profilePhotoUrl }} style={{ width: 110, height: 110, borderRadius: 55 }} />
          ) : (
            <MaterialIcons name="account-circle" size={110} color={cores.textSecondary} />
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Botao titulo="Galeria" variante="contorno" icone="photo-library" carregando={ocupado === 'foto'} onPress={() => trocarFoto(false)} />
            <Botao titulo="Câmera" variante="contorno" icone="photo-camera" desabilitado={ocupado === 'foto'} onPress={() => trocarFoto(true)} />
          </View>
        </View>

        <FormularioDoCadastro
          dados={atual}
          aoMudar={setDados}
          erros={mostrarErros ? erros : {}}
          cpfTravado
          comCongregacao
        />
        {trocouEmail && (
          <Campo
            rotulo="Senha atual (para trocar o e-mail)"
            obrigatorio
            secureTextEntry
            value={senhaParaEmail}
            onChangeText={setSenhaParaEmail}
          />
        )}
        {original.consentimento && !atual.consentimento && (
          <Aviso tipo="alerta">Sem a autorização, seus dados de saúde e religião são apagados do cadastro.</Aviso>
        )}
        <Botao titulo="Salvar dados" icone="save" carregando={ocupado === 'dados'} desabilitado={!dados} onPress={salvar} />
        {dados && <Botao titulo="Descartar alterações" variante="texto" onPress={() => setDados(null)} />}

        <Secao titulo="Trocar a senha" />
        <Campo
          rotulo="Senha atual"
          secureTextEntry
          autoComplete="current-password"
          value={senha.atual}
          onChangeText={(atual) => setSenha({ ...senha, atual })}
        />
        <Campo
          rotulo="Nova senha"
          secureTextEntry
          autoComplete="new-password"
          ajuda="De 8 a 72 caracteres, diferente da atual."
          value={senha.nova}
          onChangeText={(nova) => setSenha({ ...senha, nova })}
        />
        <Campo
          rotulo="Repita a nova senha"
          secureTextEntry
          value={senha.repetida}
          onChangeText={(repetida) => setSenha({ ...senha, repetida })}
          erro={senha.repetida && senha.repetida !== senha.nova ? 'As senhas não são iguais' : undefined}
        />
        <Botao
          titulo="Trocar a senha"
          variante="contorno"
          carregando={ocupado === 'senha'}
          desabilitado={!senha.atual || senha.nova.length < 8 || senha.nova.length > 72 || senha.nova !== senha.repetida}
          onPress={trocarSenha}
        />
      </Tela>
    </>
  );
}

