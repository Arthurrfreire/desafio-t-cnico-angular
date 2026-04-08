import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsersStore } from './users.store';
import { MOCK_API_DELAY, MockUsersApiService } from '../services/mock-users-api.service';

describe('UsersStore', () => {
  let store: UsersStore;
  let api: MockUsersApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersStore, MockUsersApiService],
    });

    store = TestBed.inject(UsersStore);
    api = TestBed.inject(MockUsersApiService);
    api.reset();
  });

  it('should load users and update state', fakeAsync(() => {
    store.loadUsers('bruno').subscribe();

    expect(store.loading()).toBe(true);
    tick(MOCK_API_DELAY);

    expect(store.loading()).toBe(false);
    expect(store.users()).toHaveLength(1);
    expect(store.users()[0]?.name).toBe('Bruno Lima');
    expect(store.totalUsers()).toBe(1);
  }));

  it('should expose error on load failure', fakeAsync(() => {
    store.loadUsers('erro').subscribe();

    tick(MOCK_API_DELAY);

    expect(store.users()).toHaveLength(0);
    expect(store.error()).toContain('Falha simulada');
  }));

  it('should expose save error and stop saving state', fakeAsync(() => {
    let receivedError = '';

    store
      .saveUser({
        name: 'Teste',
        email: 'erro@attus.dev',
        cpf: '12345678901',
        phone: '11999998888',
        phoneType: 'Celular',
      })
      .subscribe({
        error: (error: Error) => {
          receivedError = error.message;
        },
      });

    expect(store.saving()).toBe(true);
    tick(MOCK_API_DELAY);

    expect(store.saving()).toBe(false);
    expect(store.error()).toContain('Falha simulada');
    expect(receivedError).toContain('Falha simulada');
  }));
});
