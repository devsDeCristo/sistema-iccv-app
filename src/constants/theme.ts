/**
 * As cores do app, no claro e no escuro — os valores do tema do site
 * (`ic-front/src/themes`), para o app ter a mesma cara: primária `#1C0F4D` no
 * claro e `#2563EB` no escuro, a superfície dos cartões (`paper`), o texto e as
 * cores dos chips (`chips`).
 */
export const Colors = {
  light: {
    text: '#111B21',
    textSecondary: '#495C67',
    background: '#F0F1F4',
    card: '#F8F8F8',
    border: '#DCDEE1',
    primary: '#1C0F4D',
    onPrimary: '#FFFFFF',
    success: '#1B7F3B',
    warning: '#A15C00',
    danger: '#C62828',
    info: '#1565C0',
    /** os chips de situação do site (`palette.chips`) */
    chips: {
      success: '#59945B',
      alert: '#FF8000',
      info: '#0080FF',
      pending: '#8217C0',
      canceled: '#FC182E',
    },
    /** chip contornado padrão do MUI: borda e ícone */
    chipBorda: '#BDBDBD',
    chipIcone: '#616161',
    /** a base do véu que escurece a capa para a direita */
    veu: '#111B21',
    /** o tracejado do picote do ingresso: o texto a 18% */
    picote: 'rgba(17,27,33,0.18)',
  },
  dark: {
    text: '#EBEBEB',
    textSecondary: '#9FAAB0',
    background: '#030617',
    card: '#0F172A',
    border: '#27303B',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',
    chips: {
      success: '#51E956',
      alert: '#F57C00',
      info: '#2491FF',
      pending: '#A81FF7',
      canceled: '#FF1100',
    },
    chipBorda: '#616161',
    chipIcone: '#E0E0E0',
    veu: '#030617',
    picote: 'rgba(235,235,235,0.18)',
  },
} as const;

/** O par de cores vivas do site (`AZUL_VIVO`/`VIOLETA_VIVO`): botões principais e destaques */
export const AZUL_VIVO = '#2563EB';
export const VIOLETA_VIVO = '#7C3AED';

/** A barra do topo do site: a primária no claro, o `paperSecondary` no escuro */
export const BARRA = { light: '#1C0F4D', dark: '#1E293B' } as const;

export type Cores = (typeof Colors)['light'] | (typeof Colors)['dark'];
