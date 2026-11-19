/**
 * Formatos em pt-BR. Os nomes dos meses ficam aqui, e não no `Intl`, para não
 * depender do ICU de cada Android.
 */
export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const curto = (mes: number) => MESES[mes].slice(0, 3);
const dois = (n: number) => String(n).padStart(2, '0');

export const moeda = (valor: number) =>
  'R$ ' +
  valor
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Zero vira "Grátis", como no web */
export const preco = (valor: number) => (valor > 0 ? moeda(valor) : 'Grátis');

export const data = (iso: string) => {
  const d = new Date(iso);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const hora = (iso: string) => {
  const d = new Date(iso);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
};

/** "dd/MM às HH:mm": abertura e fechamento de grupo */
export const quando = (iso: string) => {
  const d = new Date(iso);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${hora(iso)}`;
};

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diasEntre = (a: Date, b: Date) =>
  Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / 86400000);

/** O período do evento, como `formatarPeriodo` do web */
export function periodo(inicio: string | null, fim: string | null, comAno = false) {
  if (!inicio) return 'Data a definir';
  const a = new Date(inicio);
  const b = fim ? new Date(fim) : a;
  const ano = (d: Date) => (comAno ? ` de ${d.getFullYear()}` : '');
  if (diasEntre(a, b) === 0) {
    return `${a.getDate()} de ${MESES[a.getMonth()]}${ano(a)} · ${hora(inicio)}`;
  }
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()} a ${b.getDate()} de ${MESES[a.getMonth()]}${ano(b)}`;
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} de ${curto(a.getMonth())} a ${b.getDate()} de ${curto(b.getMonth())}${ano(b)}`;
  }
  return `${a.getDate()} de ${curto(a.getMonth())} de ${a.getFullYear()} a ${b.getDate()} de ${curto(b.getMonth())} de ${b.getFullYear()}`;
}

/** "Começa hoje", "Faltam N dias"… até 45 dias antes; depois, nada */
export function contagemRegressiva(inicio: string | null, fim: string | null) {
  if (!inicio) return null;
  const hoje = new Date();
  const ate = diasEntre(hoje, new Date(inicio));
  if (ate === 0) return 'Começa hoje';
  if (ate < 0) return fim && diasEntre(hoje, new Date(fim)) >= 0 ? 'Acontecendo agora' : null;
  if (ate === 1) return 'Começa amanhã';
  return ate <= 45 ? `Faltam ${ate} dias` : null;
}

/** Já passou o horário de início */
export const jaComecou = (inicio: string | null) => !!inicio && Date.now() >= new Date(inicio).getTime();

/** O evento já acabou: passou o último dia inteiro */
export const jaAcabou = (fim: string | null) =>
  !!fim && diasEntre(new Date(), new Date(fim)) < 0;

/** Hoje está entre o primeiro e o último dia */
export const emAndamento = (inicio: string | null, fim: string | null) =>
  !!inicio &&
  diasEntre(new Date(inicio), new Date()) >= 0 &&
  diasEntre(new Date(), new Date(fim ?? inicio)) >= 0;

/** Notícia: "Hoje, 14:30", "Ontem", "3 de maio", "3 de maio de 2025" */
export function dataDaNoticia(iso: string) {
  const d = new Date(iso);
  const dias = diasEntre(d, new Date());
  if (dias === 0) return `Hoje, ${hora(iso)}`;
  if (dias === 1) return 'Ontem';
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} de ${d.getFullYear()}`;
}

/** "há 5 min", "há 2 h", "há 3 dias" */
export function tempoDesde(iso: string) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 1440) return `há ${Math.floor(minutos / 60)} h`;
  const dias = Math.floor(minutos / 1440);
  return dias < 30 ? `há ${dias} ${dias === 1 ? 'dia' : 'dias'}` : data(iso);
}

export const saudacao = () => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite';
};

export const primeiroNome = (nome?: string | null) => nome?.trim().split(/\s+/)[0] ?? '';

// Máscaras: o campo mostra formatado e a API recebe só os dígitos
export const digitos = (texto: string) => texto.replace(/\D/g, '');

const mascara = (texto: string, molde: string) => {
  const d = digitos(texto);
  let i = 0;
  let saida = '';
  for (const c of molde) {
    if (i >= d.length) break;
    saida += c === '0' ? d[i++] : c;
  }
  return saida;
};

export const mascaraCpf = (t: string) => mascara(t, '000.000.000-00');
export const mascaraTelefone = (t: string) => mascara(t, '(00) 00000-0000');
export const mascaraCep = (t: string) => mascara(t, '00000-000');
export const mascaraData = (t: string) => mascara(t, '00/00/0000');

/** "dd/mm/aaaa" → "aaaa-mm-dd"; data inválida → null */
export function isoDaData(texto: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const d = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  const valida =
    d.getDate() === Number(dd) && d.getMonth() === Number(mm) - 1 && d.getFullYear() > 1900 && d <= new Date();
  return valida ? `${aaaa}-${mm}-${dd}` : null;
}

/** O ISO de data de nascimento (meia-noite UTC) → "dd/mm/aaaa", sem fuso */
export const dataDoIso = (iso?: string | null) => {
  if (!iso) return '';
  const [aaaa, mm, dd] = iso.slice(0, 10).split('-');
  return `${dd}/${mm}/${aaaa}`;
};

/** Idade numa data (a do evento, para o termo do menor) */
export function idade(nascimentoIso: string, em: Date = new Date()) {
  const [a, m, d] = nascimentoIso.slice(0, 10).split('-').map(Number);
  let anos = em.getFullYear() - a;
  if (em.getMonth() + 1 < m || (em.getMonth() + 1 === m && em.getDate() < d)) anos--;
  return anos;
}
