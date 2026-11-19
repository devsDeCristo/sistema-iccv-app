import { Stack } from 'expo-router';

import { useOpcoesDaBarra } from '@/components/barra-do-topo';
import { PortaoDosTermos } from '@/components/portao-dos-termos';
import { PerguntaDePagamento } from '@/lib/pagamento';

/** A área logada: as telas do menu lateral e as que abrem por cima delas */
export default function AreaLogada() {
  const barra = useOpcoesDaBarra();
  return (
    <>
      <Stack screenOptions={{ ...barra, headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(menu)" options={{ headerShown: false }} />
      </Stack>
      <PortaoDosTermos />
      <PerguntaDePagamento />
    </>
  );
}
