# Acesso: sessão, login, cadastro, senha e Termos de Uso

## Sessão (`src/lib/sessao.tsx`, `src/lib/api.ts`)

- O token do login (`access_token`) fica no **SecureStore** (chaveiro do
  sistema), chave `access_token`. Vale 24h; a API não tem renovação nem logout
  no servidor — sair é apagar o token.
- **Quem está logado** vem de `GET /auth/validate` (`useUsuario`, cache de 5
  min). É a única resposta com `memberChurch` (`id`, `name`, `modulos`), que
  decide se Solicitações e Oportunidades aparecem. A resposta do login e do
  cadastro **não** traz isso; por isso a sessão sempre consulta o validate.
- **401** em qualquer rota com a sessão aberta encerra a sessão ("Sua sessão
  expirou"); com `code: 'CONTA_BLOQUEADA'`, avisa que a conta está bloqueada.
  No `/auth/validate`, 401/403 também encerram; falha de rede mantém o cache.
- **Navegação protegida** (`src/app/_layout.tsx`): `Stack.Protected` mostra a
  área logada só com token, e login/cadastro/senha só sem token. A troca é o
  próprio guard.

## Login (`src/app/login.tsx`)

- `POST /auth/login` com `{ document: CPF só dígitos, password }`.
- **404** (CPF sem cadastro): avisa e oferece "Criar conta", levando o CPF.
- **401 com `captchaRequired`** (2 senhas erradas, se o servidor tiver o
  Turnstile ligado): o app não tem a verificação; avisa para redefinir a senha
  ou aguardar 15 minutos.
- **429** (5 erros): mostra a mensagem e trava o botão até `bloqueadoAte`.
- **403** conta bloqueada: mensagem do servidor.

## Esqueci a senha (`src/app/esqueci-senha.tsx`)

Os três passos da API: `POST /auth/password/forgot` `{document}` (código de 8
dígitos no e-mail; reenviar só depois de 60 s), `POST
/auth/password/verify-code` `{document, code}` → `ticket` (15 min) e `POST
/auth/password/reset` `{ticket, password}`. Ticket vencido (401) volta ao
primeiro passo. Não entra sozinho: depois de redefinir, a pessoa faz login.

## Cadastro (`src/app/cadastro.tsx`, `src/lib/cadastro.ts`, `src/components/formulario-do-cadastro.tsx`)

- `POST /users`; a resposta traz o token e a sessão começa na hora.
- **Campos e regras** (as do site): nome completo (≥ 5), nome no crachá, CPF
  (11 dígitos), nascimento (`dd/mm/aaaa`), e-mail, celular e contato de
  emergência (11 dígitos), profissão, quem indicou, cargo de liderança (lista:
  Não, Pastor, Presbítero, Diácono, Evangelista, Membro; "Não" não vai), CEP
  (8 dígitos, preenche o endereço pelo ViaCEP), rua, número, bairro, cidade,
  UF (2 letras), observações, senha (8 a 72) e confirmação.
- **Menor de 18 anos** (na data de hoje): pede o nome do responsável, e o
  contato de emergência vira "Telefone do responsável".
- **Dados sensíveis** (saúde e religião): só com a caixa de autorização
  marcada; aí diabetes e hipertensão são obrigatórios (sim/não) e vai
  `sensitiveDataConsent: true`. Sem a autorização, nada disso vai.
- **Igreja:** lista de `GET /public/churches` mais "Outra" (com o nome,
  obrigatório). Vai `requestedChurchId` (pedido que a igreja aceita) ou
  `otherChurchName`, e `congregation` com o nome. O app manda ainda
  `worker: true` e `acceptedTerms: true` (a caixa dos termos é obrigatória),
  como o site.
- **Data de nascimento** vai como data-hora completa, ao meio-dia UTC
  (`1993-11-20T12:00:00.000Z`): o `PUT /users/me` repassa a string direto ao
  Prisma, que recusa só a data (500), e meio-dia UTC cai no mesmo dia em
  qualquer fuso do Brasil.
- Sem foto no cadastro (como no site); a foto entra pelo perfil.

## Termos de Uso

- **Portão** (`src/components/portao-dos-termos.tsx`): `GET /terms/status`. Se
  `aceito` é falso ou `precisaDecidirDadosSensiveis`, uma tela cheia bloqueia
  o app até a pessoa aceitar (caixa "Li e aceito os Termos de Uso") e decidir
  sobre os dados sensíveis (autorizo / não autorizo — apague). `POST
  /terms/accept` `{accepted: true, sensitiveDataConsent?}`. A única outra saída
  é sair da conta. O texto abre dentro do próprio portão (uma rota por cima
  ficaria escondida atrás do Modal).
- **Texto público** (`src/app/termos.tsx`): `GET /terms`, também antes do login.

## Diferenças do site

- **Sem login com Google.** O servidor só aceita token emitido para o client
  ID **web** (`GOOGLE_CLIENT_ID`). Para o app, é preciso o Google Sign-In
  nativo pedindo o token com esse `webClientId`, o que exige build próprio
  (não roda no Expo Go). Fica para uma próxima versão.
- **Sem captcha.** O Turnstile não tem SDK nativo. Só é exigido depois de 2
  senhas erradas e só se `TURNSTILE_SECRET_KEY` estiver ligado.
- **Sem exclusão de conta.** A API não tem rota para a pessoa apagar a própria
  conta, e as lojas (Apple e Google) exigem isso em app que cria conta. Antes
  de publicar, é preciso decidir como oferecer a exclusão.
