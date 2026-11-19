import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/**
 * O campo do site: o `TextField` contornado do MUI, com o rótulo dentro do
 * campo que sobe para a borda ao focar ou preencher, cantos de 8 e o fundo
 * `background.input` do tema. `senha` põe o olho para mostrar/esconder.
 */
export function CampoDoSite({
  rotulo,
  obrigatorio,
  senha,
  erro,
  ...props
}: TextInputProps & { rotulo: string; obrigatorio?: boolean; senha?: boolean; erro?: string }) {
  const cores = useTheme();
  const escuro = useColorScheme() === 'dark';
  const [foco, setFoco] = useState(false);
  const [ver, setVer] = useState(false);
  const fundo = escuro ? '#324154' : '#FFFFFF';
  // a borda do site: `divider` do tema, e a primária no foco (com a mesma espessura)
  const borda = erro ? cores.danger : foco ? cores.primary : cores.border;
  const subiu = foco || !!props.value;

  return (
    <View>
      <View style={[styles.caixa, { backgroundColor: fundo, borderColor: borda, borderWidth: 1 }]}>
        <TextInput
          {...props}
          secureTextEntry={senha && !ver}
          onFocus={(e) => {
            setFoco(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            props.onBlur?.(e);
          }}
          style={[styles.entrada, { color: cores.text }]}
        />
        {senha && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ver ? 'Esconder a senha' : 'Mostrar a senha'}
            onPress={() => setVer(!ver)}
            hitSlop={8}
            style={styles.olho}
          >
            {/* `action.active` do MUI: preto a 54% no claro, branco a 56% no escuro */}
            <MaterialIcons
              name={ver ? 'visibility-off' : 'visibility'}
              size={24}
              color={escuro ? 'rgba(255,255,255,0.56)' : 'rgba(0,0,0,0.54)'}
            />
          </Pressable>
        )}
        <Text
          pointerEvents="none"
          style={[
            styles.rotulo,
            subiu
              ? { top: -10, fontSize: 12, backgroundColor: fundo, color: erro ? cores.danger : foco ? cores.primary : cores.textSecondary }
              : { top: 15, fontSize: 16, color: cores.textSecondary },
          ]}
        >
          {rotulo}
          {obrigatorio ? ' *' : ''}
        </Text>
      </View>
      {!!erro && <Text style={{ color: cores.danger, fontSize: 12, marginTop: 3, marginHorizontal: 14 }}>{erro}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { height: 56, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  entrada: { flex: 1, height: '100%', fontSize: 16, paddingHorizontal: 14 },
  olho: { paddingHorizontal: 12 },
  rotulo: { position: 'absolute', left: 10, paddingHorizontal: 4 },
});
