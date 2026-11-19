import { QueryClient, useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';

import { aoSessaoExpirar, api, definirToken, ErroDaApi } from './api';
import type { Usuario } from './tipos';

const CHAVE = 'access_token';

/**
 * O token no chaveiro do sistema; no navegador (`npm run web`, só para prévia
 * de quem desenvolve) o SecureStore não existe, e vale o `localStorage`, como
 * no exemplo de autenticação da documentação do Expo.
 */
const cofre =
  Platform.OS === 'web'
    ? {
        ler: async () => localStorage.getItem(CHAVE),
        gravar: async (v: string) => localStorage.setItem(CHAVE, v),
        apagar: async () => localStorage.removeItem(CHAVE),
      }
    : {
        ler: () => SecureStore.getItemAsync(CHAVE),
        gravar: (v: string) => SecureStore.setItemAsync(CHAVE, v),
        apagar: () => SecureStore.deleteItemAsync(CHAVE),
      };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx não melhora tentando de novo; falha de rede, sim
      retry: (tentativas, erro) =>
        !(erro instanceof ErroDaApi && erro.status >= 400 && erro.status < 500) &&
        tentativas < 2,
    },
  },
});

type Sessao = {
  carregando: boolean;
  token: string | null;
  entrar: (token: string) => Promise<void>;
  sair: (aviso?: string) => Promise<void>;
};

const Contexto = createContext<Sessao | null>(null);

export function useSessao() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useSessao fora do SessaoProvider');
  return valor;
}

/**
 * O token do login fica no SecureStore (chaveiro do sistema) e vale 24h —
 * a API não tem renovação. O resto da sessão vem de `/auth/validate`
 * (`useUsuario`), que é o único lugar que traz `memberChurch` com os módulos.
 */
export function SessaoProvider({ children }: PropsWithChildren) {
  const [estado, setEstado] = useState({ carregando: true, token: null as string | null });

  useEffect(() => {
    cofre
      .ler()
      .catch(() => null)
      .then((salvo) => {
        definirToken(salvo);
        setEstado({ carregando: false, token: salvo });
      });
  }, []);

  const entrar = useCallback(async (novo: string) => {
    definirToken(novo);
    await cofre.gravar(novo);
    setEstado({ carregando: false, token: novo });
  }, []);

  const sair = useCallback(async (aviso?: string) => {
    definirToken(null);
    queryClient.clear();
    await cofre.apagar().catch(() => undefined);
    setEstado({ carregando: false, token: null });
    if (aviso) Alert.alert('Sessão encerrada', aviso);
  }, []);

  useEffect(
    () =>
      aoSessaoExpirar((bloqueada) =>
        sair(
          bloqueada
            ? 'Sua conta está bloqueada. Fale com a organização.'
            : 'Sua sessão expirou. Entre de novo.'
        )
      ),
    [sair]
  );

  return <Contexto value={{ ...estado, entrar, sair }}>{children}</Contexto>;
}

/**
 * Quem está logado. 401/403 aqui encerra a sessão; falha de rede mantém o
 * que estava em cache, para o app abrir sem internet.
 */
export function useUsuario() {
  const { token, sair } = useSessao();
  const consulta = useQuery({
    queryKey: ['usuario'],
    queryFn: () => api<Usuario>('/auth/validate'),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const erro = consulta.error;
  useEffect(() => {
    if (erro instanceof ErroDaApi && (erro.status === 401 || erro.status === 403)) {
      sair(
        erro.corpo?.code === 'CONTA_BLOQUEADA'
          ? 'Sua conta está bloqueada. Fale com a organização.'
          : 'Sua sessão expirou. Entre de novo.'
      );
    }
  }, [erro, sair]);

  return consulta;
}
