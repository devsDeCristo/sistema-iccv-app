# Eventos e inscrição

Rotas da API: `GET /events` (catálogo), `GET /events/:id`, `GET
/users/:userId/groups` (em quais grupos a pessoa está inscrita ou na lista de
espera), `GET /users/me` (data de nascimento), `POST
/events/:eventId/users/:userId` (inscrição), `POST
/events/:eventId/users/:userId/products` (compra), `POST
…/guardian-term` (termo do menor), `GET /events/:eventId/quadrante` e
`…/quadrante/pdf`. Regras do servidor em `ic-backend/docs/inscricoes.md`,
`loja-e-produtos.md` e `quadrante.md`.

Regras de evento portadas do site em `src/lib/eventos.ts`; formatos de data em
`src/lib/formato.ts` (`periodo`, `contagemRegressiva`, `jaAcabou`,
`emAndamento`).

## Início (`src/app/(app)/(menu)/index.tsx`)

O mesmo desenho e a mesma ordem da `/home` do site no celular:

1. **Boas-vindas** (`components/boas-vindas.tsx`, o `WelcomeHero`): faixa com
   degradê azul→violeta a 115°, duas luzes em cantos opostos e listras finas
   quase invisíveis; avatar (foto ou iniciais do primeiro e do último nome)
   num anel em degradê; "Bom dia/Boa tarde/Boa noite, {nome}!" com o nome em
   degradê (`MaskedView`); o texto de recepção e o botão em pílula
   "Minhas inscrições". No escuro tudo entra com metade da intensidade.
2. **Filtro de igreja** (`components/filtro-de-igreja.tsx`), à direita, só
   com mais de uma igreja: a pastilha mostra o recorte (primária quando há
   filtro) e abre a lista com busca e, à direita, quantos eventos abertos cada
   igreja tem. Vale para os ingressos e os eventos, e a escolha fica guardada
   no aparelho (`home_igreja`); igreja que saiu do catálogo vale como "todas".
3. **Meus Ingressos Ativos:** os ingressos compactos (ver
   [ingressos.md](ingressos.md)) dos eventos que ainda não acabaram, por data.
4. **Acontecendo agora** (cartaz em destaque) e **Próximos eventos**, com "N
   eventos" à direita: eventos `ACTIVE` (e `TEST`, que o servidor só manda a
   quem administra a igreja) que não acabaram. O cartaz
   (`components/cartaz.tsx`, o `CartazDoEvento`): capa de fundo com o filtro
   de 38% e o véu que escurece para a direita, logo à esquerda, selos de vidro
   em caixa alta (tipo, contagem regressiva, "Teste", "Inscrito" ou "Lista de
   espera"), nome, quando e onde, e o botão "Ver meu evento"/"Ver detalhes"
   (vidro; no destaque, degradê).
5. **Agenda de Inscrições** (`components/agenda.tsx`, a `MinhaAgenda`): o
   calendário do mês, sempre com 6 semanas, com os dias dos meus eventos
   (inscrito ou lista de espera, até 62 dias por evento) na cor de cada um e
   hoje circulado; abre no mês de hoje se algo está acontecendo, senão no do
   próximo evento. Embaixo, "Acontecendo agora" e "Meus eventos" com a barra
   na cor do evento e a data em folhinha.
6. **Notícias** (`components/mural-de-noticias.tsx`, o `NewsFeed`): as 6 mais
   recentes, com imagem, data e de qual evento (ou igreja) saiu; abrem
   inteiras em `noticia/[id]`.

Os vazios ("Nenhum ingresso ativo", "Nenhum evento com inscrições abertas")
são os do site, com o ícone redondo tingido e a saída ("Ver todas as igrejas"
ou "Ver minhas inscrições").

## Eventos (`src/app/(app)/(menu)/eventos.tsx`)

Todos os eventos que não estão inativos, do mais novo ao mais antigo,
agrupados por ano, com o mesmo cartaz e selos do Início.

## Barra do topo e menu lateral

O desenho do site no celular (`src/app/(app)/(menu)/_layout.tsx`, com o
`Drawer` do Expo Router):

- **Barra do topo** (`src/components/barra-do-topo.tsx`): cor chapada da marca
  (a primária `#1C0F4D` no claro, `#1E293B` no escuro) com o fio claro embaixo;
  à esquerda o ☰, que abre o menu, e a marca "**ICCV** Eventos"; à direita a
  pastilha de vidro com o sininho, a troca de tema (claro/escuro, guardada no
  aparelho e aplicada por `Appearance.setColorScheme`, `src/lib/tema.ts`) e o
  avatar, que abre o menu da conta: nome, e-mail, "Meu perfil" e "Sair". As
  telas que abrem por cima (evento, ingresso, perfil…) usam a mesma barra, com
  o título e a seta de voltar.
- **Menu lateral** (`src/components/menu-lateral.tsx`): 260 px no fundo
  `paper`, a marca no topo e a seção "INSCRIÇÕES" com Página Inicial, Minhas
  Inscrições, Eventos e, para membro de igreja com o módulo, Solicitações e
  Oportunidades ("NOVO!" em degradê). O item da tela aberta fica com fundo
  esmaecido e texto na cor de destaque: a primária (no escuro, a variante
  clara `#5182EF`) ou a do módulo, em Solicitações e Oportunidades.

## Página do evento (`src/app/(app)/evento/[id]/index.tsx`)

- Capa (ou a capa padrão), logo, selos (tipo, contagem regressiva, "Evento de
  teste"), nome e descrição curta.
- **Inscreva-se:** ativo com algum grupo aberto; senão o botão diz o motivo
  ("Inscrições abrem dd/MM às HH:mm", "Inscrições encerradas", "Inscrições em
  breve").
- **Quadrante:** para quem está inscrito, com o módulo de equipes ligado e o
  evento já começado.
- **Loja:** quando há produto com alguma variante disponível.
- **Quando / Onde / Tipos de ingresso**, **Sobre o evento** (HTML do editor),
  **Escolha seu ingresso** (cada grupo visível com a janela e as vagas), botão
  do **grupo de WhatsApp** (só dos grupos em que a pessoa está, como no site) e
  **Como chegar** (abre o mapa: o `linkMaps`, ou a busca pelo endereço).
- **Janela do grupo** (`estadoDoGrupo`): inativo, agendado (abre em
  `opensAt`), encerrado (`closesAt` ou o fim do evento) ou aberto.

## Inscrição (`src/app/(app)/evento/[id]/inscricao.tsx`)

1. **Grupos:** escolha de um ou mais. Travado quando já inscrito, na lista de
   espera, ou fora da janela. "Só lista de espera" quando o grupo está cheio.
2. **Ingressos:** um por grupo, com o preço ("por pessoa" ou "Grátis"). Resumo
   com o total; aviso de que esta igreja não recebe pelo site, quando for o
   caso (`church.chargesOnline ?? church.modulePayment ?? true`).
   - **Menor** (idade na data do evento abaixo de 16, ou 18 se
     `minorAgeLimit === 18`): aviso, "Baixar o termo" (o modelo é data URI;
     abre o compartilhar do sistema), "Anexar o termo assinado" (opcional; PDF
     ou imagem, enviado depois da inscrição) e a caixa "Li o aviso e vou
     entregar o termo assinado", obrigatória.
3. **Termos do evento** (`src/components/termos-do-evento.tsx`), se o evento
   tiver termo: o aceite só libera depois de rolar o texto até o fim. A
   inscrição vai com `acceptedTerms: true`.
4. **Resultado:** tudo na lista de espera → aviso e volta ao evento. Senão, se
   há produtos à venda, a **oferta de produtos** (o valor entra no pagamento da
   inscrição: `attachToRegistration: true`); durante a oferta o voltar fica
   escondido, e a pessoa decide pelos botões. Depois, o pagamento (ver
   [pagamentos.md](pagamentos.md)).

## Loja (`src/app/(app)/evento/[id]/produtos.tsx`, `src/components/oferta-de-produtos.tsx`)

- Produtos com fotos (deslizar), preço, descrição; "Adicionar à sacola" abre
  as variantes com − e + (até 20 por item, ou o disponível; "Últimas N" a
  partir de 5; "Esgotado"). A sacola soma unidades e total.
- Compra separada da inscrição. Sem `publicStore`, só quem tem inscrição
  confirmada compra (o motivo aparece no lugar da sacola).
- Depois da compra, com cobrança online (`church.modulePayment ?? true`, como
  no site), abre o pagamento; sem, avisa que o pagamento é com a organização.

## Quadrante (`src/app/(app)/evento/[id]/quadrante.tsx`)

As equipes com quem é líder, aniversário (dia/mês), e atalhos para ligar,
WhatsApp (celular com DDD) e e-mail. Busca por nome, e-mail ou telefone (3+
dígitos). "Baixar PDF" gera pelo servidor e abre o compartilhar. Quem não pode
ver lê o motivo que o servidor devolve.

## Diferenças do site

- **Grupo sem capacidade (`capacity` nulo) é sem limite**, como no servidor.
  O site trata nulo como esgotado e mostra "Lista de espera" nesses grupos.
- **Agenda sem a escolha de ano:** o calendário troca de mês pelas setas; o
  seletor de ano do calendário do site (a setinha ao lado do mês) não existe.
- **Inscrição grátis não pergunta "pagar agora?"**: o site pergunta e, no
  "Sim", leva 400 do servidor (nada a cobrar).
- **HTML do editor** (descrição, notícias, termos) aparece como texto com
  parágrafos, títulos, listas, negrito, itálico e links
  (`src/lib/html.ts`). Cores, tamanhos, alinhamento e imagens do editor ficam
  de fora; só links `http`, `https`, `mailto` e `tel` abrem.
