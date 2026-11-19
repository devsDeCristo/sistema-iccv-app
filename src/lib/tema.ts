import { Appearance } from 'react-native';

import { preferencia } from './preferencias';

const CHAVE = 'tema';

/**
 * O tema escolhido no botão da barra (como o do site): claro ou escuro, e
 * guardado no aparelho. Sem escolha, segue o do sistema. O
 * `Appearance.setColorScheme` muda o que o `useColorScheme` devolve no app
 * inteiro.
 */
export async function aplicarTemaSalvo() {
  const salvo = await preferencia.ler(CHAVE);
  if (salvo === 'light' || salvo === 'dark') Appearance.setColorScheme(salvo);
}

export function alternarTema(atual: 'light' | 'dark') {
  const proximo = atual === 'dark' ? 'light' : 'dark';
  Appearance.setColorScheme(proximo);
  preferencia.gravar(CHAVE, proximo);
}
