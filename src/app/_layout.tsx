import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useOpcoesDaBarra } from '@/components/barra-do-topo';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient, SessaoProvider, useSessao } from '@/lib/sessao';

SplashScreen.preventAutoHideAsync();

export default function Raiz() {
  const esquema = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <SessaoProvider>
        <ThemeProvider value={esquema === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style="light" />
          <Navegacao />
        </ThemeProvider>
      </SessaoProvider>
    </QueryClientProvider>
  );
}

/**
 * Com sessão, só a área logada; sem sessão, só login, cadastro e senha. A
 * troca de um lado para o outro é o próprio `guard` quem faz.
 */
function Navegacao() {
  const { carregando, token } = useSessao();
  const barra = useOpcoesDaBarra();
  if (carregando) return null;
  SplashScreen.hide();

  return (
    <Stack screenOptions={{ ...barra, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="esqueci-senha" options={{ title: 'Esqueci a senha' }} />
        <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      </Stack.Protected>
      <Stack.Screen name="termos" options={{ title: 'Termos de Uso', presentation: 'modal' }} />
    </Stack>
  );
}
