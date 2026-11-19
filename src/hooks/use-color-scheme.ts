import { useSyncExternalStore } from 'react';
import { useColorScheme as useEsquemaDoSistema } from 'react-native';

import { ouvirTema, temaEscolhido } from '@/lib/tema';

/** O tema do app: o escolhido no botão da barra ou, sem escolha, o do sistema */
export function useColorScheme() {
  const escolhido = useSyncExternalStore(ouvirTema, temaEscolhido, temaEscolhido);
  const doSistema = useEsquemaDoSistema();
  return escolhido ?? doSistema;
}
