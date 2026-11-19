# ICCV Eventos — app

App mobile (iOS e Android) da **área do usuário** do ICCV: eventos, inscrição,
loja, pagamento, ingressos, perfil, avisos, notícias, solicitações e
oportunidades. O painel do admin continua só no site (`ic-front`).

O app **não tem backend próprio nem rotas novas**: consome as mesmas rotas do
`ic-backend` que o site usa.

Feito com Expo (SDK 58), Expo Router e TanStack Query, em TypeScript.

## Rodar

```bash
yarn install
# o endereço da API; no celular físico, use o IP da máquina, não localhost
cp .env.example .env   # o .env é de cada máquina e fica fora do Git
npx expo start   # abra no Expo Go (QR no terminal) ou num simulador
```

## Prévia no navegador

`yarn web` abre o app no navegador, para comparar o desenho com o site lado
a lado (ver `docs/README.md`). Não é um alvo de publicação.

## Conferir antes de entregar

```bash
npx tsc --noEmit     # tipos
npx expo lint        # lint (inclui as regras do React Compiler)
yarn verificar       # lógica pura: HTML, máscaras, datas, vagas, pagamento
npx expo-doctor      # dependências e configuração
```

## Documentação

Regras e telas de cada módulo em [`docs/`](docs/README.md).
