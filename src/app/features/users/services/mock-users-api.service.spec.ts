import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MOCK_API_DELAY, MockUsersApiService } from './mock-users-api.service';

describe('MockUsersApiService', () => {
  let service: MockUsersApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockUsersApiService],
    });

    service = TestBed.inject(MockUsersApiService);
    service.reset();
  });

  it('should filter users by name', fakeAsync(() => {
    let resultLength = 0;
    let firstResultName = '';

    service.listUsers('ana').subscribe((users) => {
      resultLength = users.length;
      firstResultName = users[0]?.name ?? '';
    });

    tick(MOCK_API_DELAY);

    expect(resultLength).toBe(1);
    expect(firstResultName).toBe('Ana Beatriz');
  }));

  it('should create a new user', fakeAsync(() => {
    let savedId = 0;

    service
      .saveUser({
        name: 'Novo Usuário',
        email: 'novo@attus.dev',
        cpf: '12345678900',
        phone: '11999998888',
        phoneType: 'Celular',
      })
      .subscribe((user) => {
        savedId = user.id;
      });

    tick(MOCK_API_DELAY);

    expect(savedId).toBeGreaterThan(5);
  }));

  it('should emit an error when query is erro', fakeAsync(() => {
    let errorMessage = '';

    service.listUsers('erro').subscribe({
      error: (error: Error) => {
        errorMessage = error.message;
      },
    });

    tick(MOCK_API_DELAY);

    expect(errorMessage).toContain('Falha simulada');
  }));
});
