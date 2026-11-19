import { Appearance } from 'react-native';

import { preferencia } from './preferencias';

const CHAVE = 'tema';

export type Esquema = 'light' | 'dark';

/**
 * O tema escolhido no botão da barra (como o do site): claro ou escuro, e
 * guardado no aparelho. Sem escolha, segue o do sistema.
 *
 * A escolha mora aqui, e o `useColorScheme` do projeto
 * (`src/hooks/use-color-scheme.ts`) lê daqui antes do sistema. Não dá para
 * depender só do `Appearance.setColorScheme`: ele não existe em todo ambiente
 * (no react-native-web, da prévia, não existe) — quando existe, é chamado
 * também, para os elementos do sistema (teclado, alertas) acompanharem.
 */
let escolhido: Esquema | null = null;
const ouvintes = new Set<() => void>();

export const temaEscolhido = () => escolhido;

export const ouvirTema = (ouvinte: () => void) => {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
};

function definir(esquema: Esquema) {
  escolhido = esquema;
  if (typeof Appearance.setColorScheme === 'function') Appearance.setColorScheme(esquema);
  ouvintes.forEach((ouvinte) => ouvinte());
}

export async function aplicarTemaSalvo() {
  const salvo = await preferencia.ler(CHAVE);
  if (salvo === 'light' || salvo === 'dark') definir(salvo);
}

export function alternarTema(atual: Esquema) {
  const proximo = atual === 'dark' ? 'light' : 'dark';
  definir(proximo);
  preferencia.gravar(CHAVE, proximo);
}
