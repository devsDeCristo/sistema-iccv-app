# Ingressos: minhas inscrições, ingresso, termo do menor e certificado

Rota principal: `GET /users/:userId/payments` — um item por evento com as
inscrições (`registeredRoles`), a lista de espera (`waitlistRoles`), as
compras da loja (`productPurchases`), a situação do termo do menor e se a
igreja cobra online (`modulePayment`). As datas vêm do catálogo (`GET
/events`).

## Minhas inscrições (`src/app/(app)/(menu)/inscricoes.tsx`)

O título "Minhas Inscrições" e, por ano do evento (o mais recente primeiro,
"2026 · N inscrições"; evento fora do catálogo vai para "Sem data"), os
ingressos.

## O ingresso (`src/components/cartao-do-ingresso.tsx`)

O mesmo desenho do `EventCard` do site, em formato de ticket:

- **Parte principal:** capa baixa com o véu e o logo no centro; "INGRESSO" na
  cor do evento; o nome; o período (ícone de calendário); os tipos de ingresso
  em chips contornados ("Grupo · Ingresso", "(espera)" na lista de espera,
  "N compras na loja"); e o chip do termo do menor.
- **Picote:** linha tracejada com um furo em meia-lua de cada lado. É recorte
  de verdade (o contorno do ingresso é um SVG), e não bolinha pintada: a
  sombra contorna o furo, como no site (`filter: drop-shadow` no Android, a
  sombra de camada no iOS). No escuro, um fio claro de 1px no contorno.
- **Canhoto:** selo redondo na cor do evento (ingresso, ampulheta ou sacola),
  "Inscrição confirmada" / "Na lista de espera" / "Compra na loja", o chip
  "Tudo pago" ou "N pagamentos pendentes" e, quando a igreja não cobra pelo
  site, "Pague direto à organização".
- **Duas versões:** a compacta, do Início (capa mais baixa, canhoto numa
  linha só, "Confirmada" e "N pendentes"), e a grande, de Minhas inscrições
  (canhoto empilhado e centralizado, como o site no celular).
- Toque abre o ingresso inteiro.

## Ingresso (`src/app/(app)/ingresso/[eventId].tsx`)

- **Pendências:** termo do responsável pendente (anexar), aguardando
  aprovação (reenviar), recusado (o motivo, reenviar); lista de espera (em
  quais grupos); pagamentos pendentes com o valor.
- **Inscrições** (grupo · ingresso, valor, situação do pagamento e os
  produtos que entraram junto) e **compras na loja** (itens, data e situação).
- **Pagar** (só quando a igreja cobra pelo site): os itens pagáveis já vêm
  marcados; o botão mostra o total marcado. Pagável (`podePagar` em
  `src/lib/eventos.ts`): não pago, não em análise, não estornado e sem
  cobrança em andamento no gateway (aguardando com método já escolhido). O Pix
  do PayPal fica com método `OTHER` até pagar, então continua pagável — é
  assim que a pessoa volta ao código.
- **Pendente** (`pagamentosEmAberto`): tudo que não está pago, em análise,
  cancelado ou estornado.
- **Termo do menor:** PDF ou imagem pelo seletor de arquivos do sistema,
  `POST /events/:eventId/users/:userId/guardian-term` (campo `termFile`). Todo
  envio volta a situação para pendente, até o admin conferir.
- **Certificado** (quando `certificateAvailable`): `GET
  /events/:eventId/certificates/me/pdf`, gerado pela fila de PDFs do servidor
  (cabeçalho `X-Pedido-Pdf`), salvo no cache e aberto no compartilhar do
  sistema.

## Diferenças do site

- **Sem QR no ingresso**, como no site: o check-in é pelo crachá impresso.
- No site o pagamento abre numa janela à parte e começa sem nada marcado; no
  app a seleção fica no próprio ingresso, já com tudo marcado.
- O estornado não aparece para pagar (o site deixa marcar, e o servidor
  recusa).
