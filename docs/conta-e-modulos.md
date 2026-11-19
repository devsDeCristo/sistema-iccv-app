# Conta e módulos da igreja

## Conta (barra do topo)

O avatar na barra do topo abre o menu da conta, como no site: foto ou
iniciais, nome, e-mail, "Meu perfil" e "Sair" (com confirmação). Solicitações e
Oportunidades ficam no menu lateral, só para membro de igreja com o módulo no
plano (`memberChurch.modulos` do `/auth/validate`); ver
[eventos-e-inscricao.md](eventos-e-inscricao.md#barra-do-topo-e-menu-lateral).

## Perfil (`src/app/(app)/perfil.tsx`)

- **Foto:** galeria ou câmera (recorte quadrado), `POST
  /users/me/profile-photo`, campo `photo`. O arquivo vai com **nome único**
  (`{userId}-{data}.jpg`): o servidor grava a foto no storage pelo nome do
  arquivo, e o "image.jpg" de duas pessoas colidiria.
- **Dados:** o mesmo formulário do cadastro (`src/components/formulario-do-cadastro.tsx`),
  com o CPF travado e "Igreja que frequenta" em texto livre. `PUT /users/me`
  só com os campos do DTO. Trocar o e-mail pede a senha atual
  (`currentPassword`). `sensitiveDataConsent` só vai quando a autorização
  muda; tirar a autorização apaga saúde e religião (o app avisa antes de
  salvar).
- **Senha:** `POST /auth/password/change` `{currentPassword, password}` (8 a
  72, diferente da atual). Outras sessões não caem.

## Avisos (`src/app/(app)/notificacoes.tsx`, sininho em `src/components/barra-do-topo.tsx`)

- Sininho na pastilha da barra do topo: `GET /notificacoes/nao-lidas` a cada minuto.
- Lista: `GET /notificacoes` (os 30 mais recentes). Tocar marca aquele como
  lido (`POST /notificacoes/lidas` `{ids}`) e abre o assunto: evento →
  página do evento; notícia e resposta de membro → Início; resposta de
  solicitação → Solicitações. Os avisos do painel da igreja (pedido de membro,
  solicitação nova) mostram o texto e dizem para abrir pelo site.
  "Marcar todas como lidas" manda `{}` (sem `ids`; lista vazia o servidor
  recusa).

## Notícias (`src/app/(app)/noticia/[id].tsx`)

A notícia inteira (imagem, data, evento ou igreja, autor, título, chamada e o
texto do editor), da mesma consulta do mural do Início (`GET /news?take=6`).

## Solicitações (`src/app/(app)/(menu)/solicitacoes.tsx` e `src/app/(app)/solicitacoes/nova.tsx`)

- `GET /solicitacoes/minhas`: "Aguardando" (tudo que ainda não foi aceito ou
  recusado, inclusive aguardando pastor/tesouraria) e "Respondidos". Cartão
  com a situação, título, ministério, data, descrição, produtos (✓ aceito, ✗
  riscado, • sem decisão) e a resposta.
- **Nova** (`nova.tsx`): ministério da lista fixa (a mesma da API), o que está
  pedindo (até 120), por que precisa (até 2000) e de 1 a 20 produtos (nome,
  quantidade de 1 a 999, link opcional só `http(s)`). `POST /solicitacoes`. A
  igreja é a de que a pessoa é membro; a API decide.

## Oportunidades (`src/app/(app)/(menu)/oportunidades.tsx`)

As vagas abertas da igreja (`GET /oportunidades`), com o aviso de que, ao
demonstrar interesse, a igreja repassa nome, celular e e-mail a quem oferece a
vaga. "Tenho interesse" (`POST /oportunidades/:id/interesse`) e "Retirar
interesse" (`DELETE`). Quem não é membro, ou a igreja sem o módulo, lê o
motivo e o app nem consulta.
