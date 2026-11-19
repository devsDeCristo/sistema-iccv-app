import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Escolhas pequenas que ficam no aparelho (a igreja do filtro do Início). No
 * navegador da prévia, o `localStorage`.
 */
export const preferencia = {
  ler: async (chave: string) =>
    Platform.OS === 'web' ? localStorage.getItem(chave) : SecureStore.getItemAsync(chave).catch(() => null),
  gravar: async (chave: string, valor: string) =>
    Platform.OS === 'web' ? localStorage.setItem(chave, valor) : SecureStore.setItemAsync(chave, valor).catch(() => undefined),
};
