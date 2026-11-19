# Pagamentos

O app segue a regra do sistema: **pagamento pelo checkout hospedado do
gateway** (o link que ele gera). A única exceção é o **Pix do PayPal**, pago
numa tela do app — o PayPal não hospeda o Pix. Regras do servidor em
`ic-backend/docs/pagamentos.md` e `paypal.md`.

## O fluxo (`pagar()` em `src/lib/pagamento.tsx`)

1. `POST /events/:eventId/users/:userId/payments` com `{ roleRegistrationId:
   [...], paymentIds: [...] }` (ingressos e/ou compras da loja).
2. Se a resposta traz `choice` (só o PayPal pede), abre **"Como você quer
   pagar?"** com a marca do PayPal e o aviso "O pagamento é processado pelo
   PayPal": **Pix** (o código aparece no app) ou **Cartão ou conta PayPal** (no
   site dele). A escolha repete o pedido com `method: 'PIX' | 'CREDIT_CARD'`.
   "Agora não" desiste sem cobrar.
3. O `link` da resposta:
   - aponta para a tela web de Pix (`/eventos/:id/pagamento/pix/:referenceId`)
     → o app abre **a sua** tela de Pix com esses parâmetros;
   - qualquer outro → abre o checkout hospedado num navegador dentro do app
     (`expo-web-browser`). Ao fechar, o app recarrega inscrições, grupos e
     evento — o gateway devolve a pessoa para uma URL do site, que o app não
     intercepta.
4. **503**: "Esta igreja não recebe pagamento pelo site. O valor é combinado
   diretamente com a organização do evento." Outros erros: a mensagem do
   servidor.

A pergunta fica montada uma vez na área logada (`PerguntaDePagamento` em
`src/app/(app)/_layout.tsx`) e o fluxo a chama como uma promessa.

## Pix do PayPal (`src/app/(app)/evento/[id]/pix/[referenceId].tsx`)

- `GET /events/:eventId/users/:userId/payments/pix/:referenceId`, consultado a
  cada 5 s enquanto aguarda; "Já paguei" chama `POST …/check` (o servidor
  confere no PayPal no máximo a cada 15 s).
- **Situação**, na ordem: pago → em análise → encerrado (status diferente de
  aguardando) → substituído (`active` falso) → expirado (`expiresAt` passou)
  → aguardando.
- **Aguardando:** "Processado pelo PayPal", aviso de que o recebedor pode
  aparecer com esse nome no banco, o valor, o código **Pix copia e cola** com
  "Copiar código Pix" e a contagem até expirar.
- **Sem QR Code na tela:** no celular o app do banco está no mesmo aparelho e
  não tem como ler a tela; o caminho é copiar e colar.
- Pago ou em análise recarrega as inscrições. Para voltar a um Pix fechado:
  ingresso → Pagar → Pix (o servidor reaproveita o mesmo código enquanto
  faltarem mais de 5 minutos).

## Onde se paga

- **Depois da inscrição** (`inscricao.tsx`): pergunta "pagar agora?" (só com
  algo a cobrar e com a igreja cobrando online); com produtos da oferta, vai
  direto ao pagamento junto.
- **Na loja** (`produtos.tsx`): logo depois da compra.
- **No ingresso** (`ingresso/[eventId].tsx`): os itens em aberto, marcados
  (ver [ingressos.md](ingressos.md)).

## Desconto

Não há cupom: o desconto é do admin, por inscrição, e o servidor aplica no
checkout. O valor mostrado no app (o mesmo do site) é o de antes do desconto;
só o Pix mostra o valor cobrado.
