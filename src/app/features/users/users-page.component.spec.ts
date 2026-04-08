import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MOCK_API_DELAY, MockUsersApiService } from './services/mock-users-api.service';
import { UsersStore } from './data-access/users.store';
import { UsersPageComponent } from './users-page.component';

describe('UsersPageComponent', () => {
  const dialogMock = {
    open: jest.fn(),
  };

  const snackBarMock = {
    open: jest.fn(),
  };

  beforeEach(async () => {
    dialogMock.open.mockReset();
    snackBarMock.open.mockReset();

    await TestBed.configureTestingModule({
      imports: [UsersPageComponent, NoopAnimationsModule],
      providers: [
        UsersStore,
        MockUsersApiService,
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();
  });

  it('should render initial users after debounced load', fakeAsync(() => {
    const fixture = TestBed.createComponent(UsersPageComponent);

    fixture.detectChanges();
    tick(300 + MOCK_API_DELAY);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('Ana Beatriz');
    expect(html.textContent).toContain('Central de usuários');
  }));

  it('should render error state when api fails', fakeAsync(() => {
    const fixture = TestBed.createComponent(UsersPageComponent);

    fixture.detectChanges();
    tick(300 + MOCK_API_DELAY);

    fixture.componentInstance['searchControl'].setValue('erro');
    tick(300 + MOCK_API_DELAY);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Não foi possível carregar a listagem',
    );
  }));

  it('should save a user returned by dialog and show feedback', fakeAsync(() => {
    dialogMock.open.mockReturnValue({
      afterClosed: () =>
        of({
          name: 'Novo Usuário',
          email: 'novo@attus.dev',
          cpf: '12345678900',
          phone: '11999998888',
          phoneType: 'Celular',
        }),
    });

    const fixture = TestBed.createComponent(UsersPageComponent);

    fixture.detectChanges();
    tick(300 + MOCK_API_DELAY);

    const createButton = (fixture.nativeElement as HTMLElement).querySelector(
      '.create-button',
    ) as HTMLButtonElement;

    createButton.click();
    tick(MOCK_API_DELAY * 2);
    fixture.detectChanges();

    expect(dialogMock.open).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Usuário criado com sucesso.',
      'Fechar',
      expect.objectContaining({ duration: 3000 }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Novo Usuário');
  }));
});
