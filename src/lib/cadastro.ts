import { dataDoIso, digitos, idade, isoDaData, mascaraCep, mascaraCpf, mascaraTelefone } from './formato.ts';

export type DadosDoCadastro = {
  fullName: string;
  badgeName: string;
  cpf: string;
  birthday: string;
  email: string;
  cellphone: string;
  emergencyContact: string;
  guardianName: string;
  profession: string;
  indicatedBy: string;
  leadershipPosition: string;
  congregation: string;
  pastorName: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  consentimento: boolean;
  diabetes: '' | 'sim' | 'nao';
  hypertensive: '' | 'sim' | 'nao';
  religion: string;
};

export const CADASTRO_VAZIO: DadosDoCadastro = {
  fullName: '',
  badgeName: '',
  cpf: '',
  birthday: '',
  email: '',
  cellphone: '',
  emergencyContact: '',
  guardianName: '',
  profession: '',
  indicatedBy: '',
  leadershipPosition: '',
  congregation: '',
  pastorName: '',
  zipCode: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  notes: '',
  consentimento: false,
  diabetes: '',
  hypertensive: '',
  religion: '',
};

export const LIDERANCA = ['Não', 'Pastor', 'Presbítero', 'Diácono', 'Evangelista', 'Membro'];
export const SIM_NAO = [
  { valor: 'sim' as const, rotulo: 'Sim' },
  { valor: 'nao' as const, rotulo: 'Não' },
];

export const ehMenor = (d: DadosDoCadastro) => {
  const iso = isoDaData(d.birthday);
  return !!iso && idade(iso) < 18;
};

/** O cadastro de `GET /users/me` no formato do formulário */
export function dadosDoUsuario(u: Record<string, any>): DadosDoCadastro {
  const texto = (v: unknown) => (v == null ? '' : String(v));
  const simNao = (v: unknown) => (v === true ? 'sim' : v === false ? 'nao' : '');
  return {
    ...CADASTRO_VAZIO,
    fullName: texto(u.fullName),
    badgeName: texto(u.badgeName),
    cpf: mascaraCpf(texto(u.cpf)),
    birthday: dataDoIso(u.birthday),
    email: texto(u.email),
    cellphone: mascaraTelefone(texto(u.cellphone)),
    emergencyContact: mascaraTelefone(texto(u.emergencyContact)),
    guardianName: texto(u.guardianName),
    profession: texto(u.profession),
    indicatedBy: texto(u.indicatedBy),
    leadershipPosition: texto(u.leadershipPosition),
    congregation: texto(u.congregation),
    pastorName: texto(u.pastorName),
    zipCode: mascaraCep(texto(u.zipCode)),
    street: texto(u.street),
    number: texto(u.number),
    neighborhood: texto(u.neighborhood),
    city: texto(u.city),
    state: texto(u.state),
    notes: texto(u.notes),
    consentimento: !!u.sensitiveConsentAt,
    diabetes: simNao(u.diabetes),
    hypertensive: simNao(u.hypertensive),
    religion: texto(u.religion),
  };
}

/** As regras do formulário do web (zod + campos obrigatórios da tela) */
export function validarCadastro(d: DadosDoCadastro) {
  const erros: Partial<Record<keyof DadosDoCadastro, string>> = {};
  const obrigatorio = (campo: keyof DadosDoCadastro, min = 1, msg = 'Campo obrigatório') => {
    if (String(d[campo]).trim().length < min) erros[campo] = msg;
  };
  obrigatorio('fullName', 5, 'Informe o nome completo');
  obrigatorio('badgeName', 1, 'Como você quer ser chamado no crachá');
  if (digitos(d.cpf).length !== 11) erros.cpf = 'CPF incompleto';
  if (!isoDaData(d.birthday)) erros.birthday = 'Data inválida (dd/mm/aaaa)';
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) erros.email = 'Informe um e-mail válido';
  if (digitos(d.cellphone).length !== 11) erros.cellphone = 'Celular com DDD: (00) 00000-0000';
  if (digitos(d.emergencyContact).length !== 11) erros.emergencyContact = 'Telefone com DDD: (00) 00000-0000';
  if (ehMenor(d)) obrigatorio('guardianName', 2, 'Informe o nome do responsável');
  obrigatorio('profession', 2);
  obrigatorio('indicatedBy', 2);
  if (digitos(d.zipCode).length !== 8) erros.zipCode = 'CEP com 8 dígitos';
  obrigatorio('street');
  obrigatorio('number');
  obrigatorio('neighborhood');
  obrigatorio('city', 2);
  if (!/^[A-Za-z]{2}$/.test(d.state.trim())) erros.state = 'Sigla do estado (ex.: CE)';
  if (d.consentimento) {
    if (!d.diabetes) erros.diabetes = 'Responda sim ou não';
    if (!d.hypertensive) erros.hypertensive = 'Responda sim ou não';
  }
  return erros;
}

const opcional = (v: string) => v.trim() || undefined;

/**
 * O corpo para a API: só os campos do DTO (o servidor recusa campo a mais),
 * máscaras fora, vazio vira ausente. Os dados sensíveis só vão com o
 * consentimento — sem ele o servidor descarta.
 */
export function corpoDoCadastro(d: DadosDoCadastro) {
  return {
    fullName: d.fullName.trim(),
    badgeName: opcional(d.badgeName),
    cpf: digitos(d.cpf),
    // data-hora completa: o PUT /users/me repassa a string ao Prisma, que recusa só a data.
    // Meio-dia UTC cai no mesmo dia em qualquer fuso do Brasil.
    birthday: `${isoDaData(d.birthday)}T12:00:00.000Z`,
    email: d.email.trim(),
    cellphone: digitos(d.cellphone),
    emergencyContact: digitos(d.emergencyContact) || undefined,
    guardianName: ehMenor(d) ? opcional(d.guardianName) : undefined,
    profession: d.profession.trim(),
    indicatedBy: opcional(d.indicatedBy),
    leadershipPosition:
      d.leadershipPosition && d.leadershipPosition !== 'Não' ? d.leadershipPosition : undefined,
    pastorName: opcional(d.pastorName),
    zipCode: digitos(d.zipCode) || undefined,
    street: opcional(d.street),
    number: opcional(d.number),
    neighborhood: d.neighborhood.trim(),
    city: d.city.trim(),
    state: d.state.trim().toUpperCase(),
    notes: opcional(d.notes),
    ...(d.consentimento && {
      diabetes: d.diabetes === 'sim',
      hypertensive: d.hypertensive === 'sim',
      religion: opcional(d.religion),
    }),
  };
}
