import { View } from 'react-native';

import { ehMenor, LIDERANCA, SIM_NAO, type DadosDoCadastro } from '@/lib/cadastro';
import { digitos, mascaraCep, mascaraCpf, mascaraData, mascaraTelefone } from '@/lib/formato';

import { Campo, Marcador, Secao, Seletor, T } from './ui';

/** Preenche o endereço pelo CEP (ViaCEP, o mesmo do web); falha fica em silêncio */
async function buscarCep(cep: string) {
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const corpo = await r.json();
    return corpo?.erro ? null : corpo;
  } catch {
    return null;
  }
}

export function FormularioDoCadastro({
  dados,
  aoMudar,
  erros,
  cpfTravado,
  comCongregacao,
}: {
  dados: DadosDoCadastro;
  aoMudar: (d: DadosDoCadastro) => void;
  erros: Partial<Record<keyof DadosDoCadastro, string>>;
  /** no perfil o CPF é a identificação de acesso: não muda */
  cpfTravado?: boolean;
  /** no cadastro a igreja vem da lista; no perfil, texto livre */
  comCongregacao?: boolean;
}) {
  const campo = (nome: keyof DadosDoCadastro, mascara?: (t: string) => string) => ({
    value: String(dados[nome]),
    onChangeText: (t: string) => aoMudar({ ...dados, [nome]: mascara ? mascara(t) : t }),
    erro: erros[nome],
  });
  const menor = ehMenor(dados);

  const mudarCep = async (t: string) => {
    const zipCode = mascaraCep(t);
    aoMudar({ ...dados, zipCode });
    if (digitos(zipCode).length === 8) {
      const endereco = await buscarCep(digitos(zipCode));
      if (endereco) {
        aoMudar({
          ...dados,
          zipCode,
          street: endereco.logradouro || dados.street,
          neighborhood: endereco.bairro || dados.neighborhood,
          city: endereco.localidade || dados.city,
          state: endereco.uf || dados.state,
        });
      }
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Secao titulo="Dados pessoais" />
      <Campo rotulo="Nome completo" obrigatorio autoComplete="name" {...campo('fullName')} />
      <Campo rotulo="Nome no crachá" obrigatorio {...campo('badgeName')} />
      <Campo
        rotulo="CPF"
        obrigatorio
        keyboardType="number-pad"
        editable={!cpfTravado}
        ajuda={cpfTravado ? 'O CPF é a sua identificação de acesso e não muda.' : undefined}
        {...campo('cpf', mascaraCpf)}
      />
      <Campo
        rotulo="Data de nascimento"
        obrigatorio
        keyboardType="number-pad"
        placeholder="dd/mm/aaaa"
        {...campo('birthday', mascaraData)}
      />
      <Campo
        rotulo="E-mail"
        obrigatorio
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        {...campo('email')}
      />
      <Campo
        rotulo="Celular"
        obrigatorio
        keyboardType="phone-pad"
        placeholder="(00) 00000-0000"
        {...campo('cellphone', mascaraTelefone)}
      />
      {menor && (
        <>
          <Secao titulo="Dados do responsável do menor" />
          <Campo rotulo="Nome do responsável" obrigatorio {...campo('guardianName')} />
        </>
      )}
      <Campo
        rotulo={menor ? 'Telefone do responsável' : 'Contato de emergência'}
        obrigatorio
        keyboardType="phone-pad"
        placeholder="(00) 00000-0000"
        {...campo('emergencyContact', mascaraTelefone)}
      />
      <Campo rotulo="Profissão" obrigatorio {...campo('profession')} />
      <Campo rotulo="Quem indicou?" obrigatorio {...campo('indicatedBy')} />
      <Seletor
        rotulo="Cargo de liderança"
        valor={dados.leadershipPosition}
        opcoes={LIDERANCA.map((c) => ({ valor: c, rotulo: c }))}
        aoMudar={(leadershipPosition) => aoMudar({ ...dados, leadershipPosition })}
      />
      {comCongregacao && <Campo rotulo="Igreja que frequenta" {...campo('congregation')} />}
      <Campo rotulo="Nome do pastor" {...campo('pastorName')} />

      <Secao titulo="Endereço" />
      <Campo
        rotulo="CEP"
        obrigatorio
        keyboardType="number-pad"
        value={dados.zipCode}
        onChangeText={mudarCep}
        erro={erros.zipCode}
        ajuda="O endereço se preenche pelo CEP."
      />
      <Campo rotulo="Rua" obrigatorio {...campo('street')} />
      <Campo rotulo="Número" obrigatorio placeholder="s/n se não houver" {...campo('number')} />
      <Campo rotulo="Bairro" obrigatorio {...campo('neighborhood')} />
      <Campo rotulo="Cidade" obrigatorio {...campo('city')} />
      <Campo
        rotulo="Estado"
        obrigatorio
        autoCapitalize="characters"
        maxLength={2}
        {...campo('state', (t) => t.replace(/[^A-Za-z]/g, '').toUpperCase())}
      />
      <Campo rotulo="Observações" multiline {...campo('notes')} />

      <Secao titulo="Dados de saúde e religião" />
      <Marcador marcado={dados.consentimento} aoMudar={(consentimento) => aoMudar({ ...dados, consentimento })}>
        <T>
          Autorizo a organização a usar meus dados de saúde e religião para cuidar de mim nos eventos.
        </T>
      </Marcador>
      {dados.consentimento && (
        <>
          <Seletor
            rotulo="Diabetes"
            obrigatorio
            valor={dados.diabetes}
            opcoes={SIM_NAO}
            aoMudar={(diabetes) => aoMudar({ ...dados, diabetes })}
            erro={erros.diabetes}
          />
          <Seletor
            rotulo="Hipertensão"
            obrigatorio
            valor={dados.hypertensive}
            opcoes={SIM_NAO}
            aoMudar={(hypertensive) => aoMudar({ ...dados, hypertensive })}
            erro={erros.hypertensive}
          />
          <Campo rotulo="Religião" {...campo('religion')} />
        </>
      )}
    </View>
  );
}
