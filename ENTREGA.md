# Entrega - Avaliacao Tecnica Front End Angular

[Link do codigo publico.](https://github.com/Arthurrfreire/desafio-t-cnico-angular)

## 1. TypeScript e Qualidade de Codigo

### 1.1 Refatoracao

Principais melhorias:

- Remover `any` e usar tipagem forte.
- Corrigir convencoes de nomenclatura (`Produto`, `Verdureira`, `produtoId`).
- Tornar propriedades imutaveis quando possivel com `readonly`.
- Evitar repeticao criando um metodo privado para buscar o produto.
- Usar `find` em vez de `for` manual.
- Usar comparacao estrita (`===`).
- Tratar o caso de produto nao encontrado.
- Encapsular comportamento dentro da propria entidade.

```ts
class Produto {
  constructor(
    public readonly id: number,
    public readonly descricao: string,
    private quantidadeEstoque: number,
  ) {}

  formatarDescricao(): string {
    return `${this.id} - ${this.descricao} (${this.quantidadeEstoque}x)`;
  }

  temEstoque(): boolean {
    return this.quantidadeEstoque > 0;
  }
}

class Verdureira {
  private readonly produtos: Produto[] = [
    new Produto(1, 'Maca', 20),
    new Produto(2, 'Laranja', 0),
    new Produto(3, 'Limao', 20),
  ];

  getDescricaoProduto(produtoId: number): string {
    return this.buscarProdutoPorId(produtoId).formatarDescricao();
  }

  hasEstoqueProduto(produtoId: number): boolean {
    return this.buscarProdutoPorId(produtoId).temEstoque();
  }

  private buscarProdutoPorId(produtoId: number): Produto {
    const produto = this.produtos.find((item) => item.id === produtoId);

    if (!produto) {
      throw new Error(`Produto ${produtoId} nao encontrado.`);
    }

    return produto;
  }
}
```

### 1.2 Generics e tipos utilitarios

```ts
type PaginaParams = Readonly<{
  pagina: number;
  tamanho: number;
}>;

type Pagina<T> = Readonly<{
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
}>;

function filtrarEPaginar<T>(
  data: ReadonlyArray<T>,
  filterFn: (item: T) => boolean,
  params: PaginaParams,
): Pagina<T> {
  const pagina = Math.max(1, params.pagina);
  const tamanho = Math.max(1, params.tamanho);
  const filtrados = data.filter(filterFn);
  const inicio = (pagina - 1) * tamanho;
  const fim = inicio + tamanho;

  return {
    itens: filtrados.slice(inicio, fim),
    total: filtrados.length,
    pagina,
    tamanho,
  };
}

type Usuario = {
  id: number;
  nome: string;
  email: string;
};

const usuarios: Usuario[] = [
  { id: 1, nome: 'Ana', email: 'ana@email.com' },
  { id: 2, nome: 'Bruno', email: 'bruno@email.com' },
  { id: 3, nome: 'Anabela', email: 'anabela@email.com' },
  { id: 4, nome: 'Carlos', email: 'carlos@email.com' },
];

const paginaAtual = filtrarEPaginar(
  usuarios,
  (usuario) => usuario.nome.toLowerCase().includes('ana'),
  { pagina: 1, tamanho: 2 },
);

// resultado:
// {
//   itens: [
//     { id: 1, nome: 'Ana', email: 'ana@email.com' },
//     { id: 3, nome: 'Anabela', email: 'anabela@email.com' }
//   ],
//   total: 2,
//   pagina: 1,
//   tamanho: 2
// }
```

## 2. Angular - Fundamentos e Reatividade

### 2.1 Change Detection e OnPush

O problema e que o componente usa `ChangeDetectionStrategy.OnPush` e a alteracao de `texto` acontece dentro de um `subscribe` assincrono. Nesse modo, o Angular nao re-renderiza o componente apenas porque uma propriedade interna mudou; ele precisa ser marcado para verificacao.

O `setInterval` nao resolve o problema porque:

- ele nao altera nenhuma referencia de `@Input`;
- ele nao marca o componente como dirty;
- `contador` nem aparece no template.

Correcao recomendada: injetar `ChangeDetectorRef` e chamar `markForCheck()` dentro do `subscribe`.

```ts
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injectable,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
class PessoaService {
  buscarPorId(id: number) {
    return of({ id, nome: 'Joao' }).pipe(delay(500));
  }
}

@Component({
  selector: 'app-root',
  providers: [PessoaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>{{ texto }}</h1>`,
})
export class AppComponent implements OnInit, OnDestroy {
  texto = '';
  contador = 0;
  private intervaloId?: ReturnType<typeof setInterval>;
  private subscriptionBuscarPessoa?: Subscription;

  constructor(
    private readonly pessoaService: PessoaService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscriptionBuscarPessoa = this.pessoaService.buscarPorId(1).subscribe((pessoa) => {
      this.texto = `Nome: ${pessoa.nome}`;
      this.cdr.markForCheck();
    });

    this.intervaloId = setInterval(() => {
      this.contador++;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptionBuscarPessoa?.unsubscribe();

    if (this.intervaloId) {
      clearInterval(this.intervaloId);
    }
  }
}
```

### 2.2 RxJS - eliminando subscriptions aninhadas

Como as duas chamadas sao independentes e ambas retornam um unico valor, `forkJoin` e a melhor escolha. Ele executa as requisicoes em paralelo e entrega o resultado combinado em um unico `subscribe`.

```ts
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

ngOnInit(): void {
  const pessoaId = 1;

  forkJoin({
    pessoa: this.pessoaService.buscarPorId(pessoaId),
    qtd: this.pessoaService.buscarQuantidadeFamiliares(pessoaId),
  })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ pessoa, qtd }) => {
      this.texto = `Nome: ${pessoa.nome} | familiares: ${qtd}`;
    });
}
```

Se o requisito fosse cancelar buscas anteriores em caso de nova emissao, eu usaria `switchMap`.

### 2.3 RxJS - busca com debounce

#### Servico

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

type Usuario = {
  id: number;
  nome: string;
  email: string;
};

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  buscarPorNome(termo: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>('/api/usuarios', {
      params: { nome: termo },
    });
  }
}
```

#### Componente

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, shareReplay, startWith, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-busca-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  templateUrl: './busca-usuarios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscaUsuariosComponent {
  readonly buscaControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(false);

  readonly usuarios$ = this.buscaControl.valueChanges.pipe(
    startWith(this.buscaControl.getRawValue()),
    debounceTime(500),
    distinctUntilChanged(),
    tap(() => this.loading.set(true)),
    switchMap((termo) =>
      this.usuarioService.buscarPorNome(termo).pipe(
        catchError(() => of([])),
        finalize(() => this.loading.set(false)),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(private readonly usuarioService: UsuarioService) {}
}
```

#### Template

```html
<input type="text" [formControl]="buscaControl" placeholder="Buscar usuario" />

@if (loading()) {
  <p>Carregando...</p>
}

<ul>
  @for (usuario of usuarios$ | async; track usuario.id) {
    <li>{{ usuario.nome }} - {{ usuario.email }}</li>
  }
</ul>
```

Por que essa abordagem funciona:

- `debounceTime(500)` espera o usuario parar de digitar.
- `switchMap` cancela a requisicao anterior.
- `loading` sinaliza o estado da tela.
- `async` pipe cuida da inscricao e evita memory leak.

### 2.4 Performance - OnPush e trackBy

- `trackBy` evita que o Angular destrua e recrie todos os itens da lista quando apenas um item muda. Sem ele, o framework compara por identidade de objeto e pode remontar mais DOM do que o necessario.
- A implementacao correta deve usar uma chave estavel, normalmente o `id`.

```ts
trackByUserId(_: number, user: User): number {
  return user.id;
}
```

- `ChangeDetectionStrategy.OnPush` reduz ciclos porque o componente so sera reavaliado quando houver nova referencia de `@Input`, evento do proprio componente, `async` pipe emitindo valor ou `markForCheck()`.
- Em uma lista grande, isso reduz verificacoes desnecessarias em cada ciclo global de change detection.
- Com a estrategia `Default`, qualquer evento assincro no app pode disparar verificacao completa na arvore. Em listas com centenas de itens isso aumenta custo de CPU e pode causar engasgos visuais.

## 3. Gerenciamento de Estado

### 3.1 Angular Signals - estado local

```ts
import { ChangeDetectionStrategy, Component, computed, effect, output, signal } from '@angular/core';

type CarrinhoItem = {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
};

@Component({
  selector: 'app-cart-counter',
  standalone: true,
  template: `
    <p>Itens: {{ itens().length }}</p>
    <p>Total: {{ total() | currency:'BRL' }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartCounterComponent {
  readonly itens = signal<CarrinhoItem[]>([]);
  readonly total = computed(() =>
    this.itens().reduce((acumulado, item) => acumulado + item.preco * item.quantidade, 0),
  );
  readonly totalChanged = output<number>();

  constructor() {
    effect(() => {
      this.totalChanged.emit(this.total());
    });
  }

  adicionarItem(novoItem: Omit<CarrinhoItem, 'quantidade'>): void {
    this.itens.update((itens) => {
      const itemExistente = itens.find((item) => item.id === novoItem.id);

      if (!itemExistente) {
        return [...itens, { ...novoItem, quantidade: 1 }];
      }

      return itens.map((item) =>
        item.id === novoItem.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item,
      );
    });
  }

  removerItem(itemId: number): void {
    this.itens.update((itens) =>
      itens
        .map((item) =>
          item.id === itemId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item,
        )
        .filter((item) => item.quantidade > 0),
    );
  }
}
```

### 3.2 Gerenciamento de Estado com NgRx (Feature To-do)

#### Modelo e estado

```ts
import { EntityState, createEntityAdapter } from '@ngrx/entity';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface TodoState extends EntityState<Todo> {
  loading: boolean;
  error: string | null;
}

export const todoAdapter = createEntityAdapter<Todo>();

export const initialState: TodoState = todoAdapter.getInitialState({
  loading: false,
  error: null,
});
```

#### Actions

```ts
import { createAction, props } from '@ngrx/store';

export const loadTodos = createAction('[Todo Page] Load Todos');

export const loadTodosSuccess = createAction(
  '[Todo API] Load Todos Success',
  props<{ todos: Todo[] }>(),
);

export const loadTodosError = createAction(
  '[Todo API] Load Todos Error',
  props<{ error: string }>(),
);

export const toggleTodoComplete = createAction(
  '[Todo List] Toggle Todo Complete',
  props<{ id: number }>(),
);
```

#### Reducer

```ts
import { createReducer, on } from '@ngrx/store';

export const todoReducer = createReducer(
  initialState,
  on(loadTodos, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(loadTodosSuccess, (state, { todos }) =>
    todoAdapter.setAll(todos, {
      ...state,
      loading: false,
      error: null,
    }),
  ),
  on(loadTodosError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(toggleTodoComplete, (state, { id }) => {
    const todo = state.entities[id];

    if (!todo) {
      return state;
    }

    return todoAdapter.updateOne(
      {
        id,
        changes: { completed: !todo.completed },
      },
      state,
    );
  }),
);
```

#### Selectors

```ts
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const TODO_FEATURE_KEY = 'todos';

export const selectTodoState =
  createFeatureSelector<TodoState>(TODO_FEATURE_KEY);

const { selectAll } = todoAdapter.getSelectors();

export const selectAllTodos = createSelector(selectTodoState, (state) =>
  selectAll(state),
);

export const selectPendingTodos = createSelector(selectAllTodos, (todos) =>
  todos.filter((todo) => !todo.completed),
);
```

#### Effect

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

@Injectable()
export class TodoEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);

  readonly loadTodos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTodos),
      switchMap(() =>
        this.http.get<Todo[]>('https://api.exemplo.dev/todos').pipe(
          map((todos) => loadTodosSuccess({ todos })),
          catchError((error: unknown) =>
            of(
              loadTodosError({
                error: error instanceof Error ? error.message : 'Erro ao carregar tarefas.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
```

## 4. Desafio Pratico - Aplicacao Angular

### 4.1 O que construir

A parte pratica foi implementada neste repositorio.

O que esta entregue:

- Tela de listagem com cards de usuario contendo nome, e-mail e botao de editar.
- Filtro por nome com debounce de 300ms.
- Loading durante o carregamento.
- Estado de erro em caso de falha da API mockada.
- Modal de criacao e edicao de usuario.
- Formulario reativo com `e-mail`, `nome`, `cpf`, `telefone` e `tipo de telefone`.
- Validacao por campo com mensagens de erro.
- Botao de salvar desabilitado quando o formulario esta invalido.
- Preenchimento automatico do formulario no modo de edicao.

Arquivos principais:

- `src/app/features/users/users-page.component.*`
- `src/app/features/users/ui/user-dialog.component.*`
- `src/app/features/users/data-access/users.store.ts`
- `src/app/features/users/services/mock-users-api.service.ts`

### 4.2 Requisitos tecnicos

Requisitos atendidos:

- Componentes standalone.
- Angular Material como biblioteca de UI.
- Estado local com Signals.
- RxJS em uso real com `debounceTime`, `distinctUntilChanged`, `switchMap`, `catchError`, `startWith` e `tap`.
- Subscriptions gerenciadas com `takeUntilDestroyed` e `async` pipe nas respostas teoricas.
- Testes com Jest.
- Cobertura acima de 60%: cobertura atual acima de 90%.

### 4.3 Diferenciais

Diferenciais entregues:

- Validacao de formato para e-mail, CPF e telefone.
- README com instrucoes de instalacao e execucao.
- UI refinada em relacao ao prototipo, mantendo clareza e responsividade.

## Observacao final

Para entrega final ao avaliador, basta publicar este repositorio no GitHub e substituir a linha do link no topo deste arquivo pelo URL publico do projeto.
