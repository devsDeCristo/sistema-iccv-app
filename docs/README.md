# Documentação dos módulos

Cada arquivo descreve um módulo do app: o que ele faz, as regras que valem
nele, as rotas da API que consome e onde está no código. Serve de contexto
para quem (pessoa ou IA) for mexer no app.

| Módulo | Telas | Arquivo |
| --- | --- | --- |
| Acesso (sessão, login, cadastro, senha, Termos de Uso) | `login`, `cadastro`, `esqueci-senha`, `termos`, portão dos termos | [acesso.md](acesso.md) |
| Eventos e inscrição (início, eventos, página do evento, inscrição, loja, quadrante) | abas Início e Eventos, `evento/[id]/…` | [eventos-e-inscricao.md](eventos-e-inscricao.md) |
| Pagamentos (checkout hospedado e Pix do PayPal) | `evento/[id]/pix/[referenceId]` e o fluxo `pagar()` | [pagamentos.md](pagamentos.md) |
| Ingressos (minhas inscrições, ingresso, termo do menor, certificado) | aba Inscrições, `ingresso/[eventId]` | [ingressos.md](ingressos.md) |
| Conta e módulos da igreja (perfil, avisos, notícias, solicitações, oportunidades) | aba Mais, `perfil`, `notificacoes`, `noticia/[id]`, `solicitacoes`, `oportunidades` | [conta-e-modulos.md](conta-e-modulos.md) |

## Regras que valem em todo o app

- **Só rotas que já existem.** O app não ganha rota própria no `ic-backend`.
  Quando uma tela precisar de algo que a API não dá, a tela se adapta (ou a
  limitação fica escrita aqui), em vez de nascer rota nova. As rotas que o app
  usa estão listadas em cada módulo; mudar o contrato delas no backend afeta o
  app (ver `ic-backend/docs/README.md`).
- **O backend recusa campo a mais** (`ValidationPipe` com
  `forbidNonWhitelisted`). Corpo de requisição leva só os campos do DTO.
- **Mesmo comportamento e mesmo desenho do site.** Cada tela porta o
  componente web correspondente (medidas, cores do tema web, chips, ícones
  contornados, textos), não um redesenho. As cores do site estão em
  `src/constants/theme.ts` (`chips`, `veu`, `picote`, `AZUL_VIVO`,
  `VIOLETA_VIVO`, `BARRA`). Onde o React Native não tem o recurso do CSS
  (máscara, `linear-gradient`, `background-clip: text`), usa-se SVG
  (`react-native-svg`, `src/components/degrade.tsx`) ou `MaskedView` em vez de
  simplificar o desenho. As diferenças de propósito ficam listadas em cada
  módulo (seção "Diferenças do site").
- **Conferir o desenho lado a lado:** a prévia web do app (`yarn web`, com
  `EXPO_PUBLIC_API_URL` apontando para a API) e o site (`vite` no `ic-front`),
  os dois na mesma API, numa janela de 390 px, no claro e no escuro. A prévia
  web serve só para isso: o token vai para o `localStorage` e o nome em
  degradê das boas-vindas fica azul. Não suba o Metro com `CI=1` para isso —
  nesse modo ele não observa os arquivos e serve o código antigo.
- **Erros:** toda chamada passa por `api()` (`src/lib/api.ts`), que transforma
  o erro do Nest em `ErroDaApi` com a mensagem do servidor (lista de validação
  vira uma linha por item). A tela mostra essa mensagem num `Alert` ou num
  `Aviso`.
- **Texto vazio no JSX:** no React Native, `{texto && <X/>}` com `texto === ''`
  derruba a tela. Para valor que pode ser texto, usar `{!!texto && <X/>}`.
- **Conferência:** `yarn verificar` (`scripts/verificar.mts`) roda as regras
  puras de `src/lib` em Node, sem simulador.

## Onde está cada coisa

- `src/app/` — as telas (cada arquivo é uma rota do Expo Router).
  - `(app)/` — área logada; `(app)/(abas)/` — as quatro abas.
  - fora de `(app)/` — telas sem login (`login`, `cadastro`, `esqueci-senha`)
    e `termos` (pública).
- `src/components/` — peças de tela compartilhadas (`ui.tsx` tem texto, botão,
  campo, seletor, marcador, chip, cartão e avisos).
- `src/lib/` — sem tela: cliente da API, sessão, consultas, regras de evento,
  formatos, cadastro, leitor de HTML e o fluxo de pagamento.
- `src/constants/theme.ts` — cores (claro e escuro), as mesmas do tema do site.
