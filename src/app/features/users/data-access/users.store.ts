import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, tap, throwError } from 'rxjs';
import { SaveUserCommand, User } from '../models/user.model';
import { MockUsersApiService } from '../services/mock-users-api.service';

@Injectable({
  providedIn: 'root',
})
export class UsersStore {
  private readonly usersApi = inject(MockUsersApiService);

  private readonly usersState = signal<readonly User[]>([]);
  private readonly loadingCount = signal(0);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly currentQueryState = signal('');

  readonly users = this.usersState.asReadonly();
  readonly loading = computed(() => this.loadingCount() > 0);
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly currentQuery = this.currentQueryState.asReadonly();
  readonly totalUsers = computed(() => this.usersState().length);

  loadUsers(query = ''): Observable<readonly User[]> {
    return defer(() => {
      this.currentQueryState.set(query);
      this.errorState.set(null);
      this.loadingCount.update((count) => count + 1);

      return this.usersApi.listUsers(query).pipe(
        tap((users) => this.usersState.set(users)),
        catchError((error: unknown) => {
          this.usersState.set([]);
          this.errorState.set(this.getErrorMessage(error, 'Não foi possível carregar a lista de usuários.'));
          return EMPTY;
        }),
        finalize(() => {
          this.loadingCount.update((count) => Math.max(0, count - 1));
        }),
      );
    });
  }

  saveUser(command: SaveUserCommand): Observable<User> {
    return defer(() => {
      this.errorState.set(null);
      this.savingState.set(true);

      return this.usersApi.saveUser(command).pipe(
        catchError((error: unknown) => {
          const message = this.getErrorMessage(error, 'Não foi possível salvar o usuário.');
          this.errorState.set(message);

          return throwError(() => new Error(message));
        }),
        finalize(() => {
          this.savingState.set(false);
        }),
      );
    });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return fallback;
  }
}
