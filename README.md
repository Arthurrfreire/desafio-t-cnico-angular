# Desafio Tecnico Angular

Aplicacao Angular standalone desenvolvida para o teste tecnico de Front End da Attus.

## Stack

- Angular 20
- Angular Material
- Signals para estado local da feature
- RxJS para busca reativa e fluxo assincrono
- Jest para testes unitarios

## Funcionalidades

- Listagem de usuarios em cards com nome, e-mail e acao de edicao
- Busca por nome com debounce de 300ms e cancelamento da requisicao anterior
- Estado de loading durante o carregamento
- Mensagem de erro em caso de falha da API mockada
- Modal de criacao e edicao com formulario reativo
- Validacao de nome, e-mail, CPF, telefone e tipo de telefone
- Botao de salvar desabilitado enquanto o formulario estiver invalido

## Estrutura principal

- `src/app/features/users/users-page.component.*`: tela de listagem
- `src/app/features/users/ui/user-dialog.component.*`: modal de criacao e edicao
- `src/app/features/users/data-access/users.store.ts`: estado local com Signals
- `src/app/features/users/services/mock-users-api.service.ts`: API mockada em memoria
- `ENTREGA.md`: respostas completas das questoes teoricas e resumo da parte pratica

## Requisitos

- Node 20.20.1 ou superior
- npm 11 ou superior

O projeto possui configuracao de `volta` no `package.json` e arquivo `.nvmrc` para facilitar a troca de versao.

## Como executar

```bash
npm install
npm start
```

Aplicacao disponivel em `http://localhost:4200/`.

## Como testar

```bash
npm test
```

Cobertura atual: acima de 90%.

## Como gerar build

```bash
npm run build
```

## Observacao sobre a API mockada

A busca aceita o termo `erro` para simular falha na listagem e validar o estado de erro da interface.
