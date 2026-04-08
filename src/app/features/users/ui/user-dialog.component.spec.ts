import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserDialogComponent } from './user-dialog.component';

describe('UserDialogComponent', () => {
  const dialogRefMock = {
    close: jest.fn(),
  };

  async function createComponent(data: unknown): Promise<ComponentFixture<UserDialogComponent>> {
    await TestBed.configureTestingModule({
      imports: [UserDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    }).compileComponents();

    return TestBed.createComponent(UserDialogComponent);
  }

  beforeEach(() => {
    dialogRefMock.close.mockReset();
  });

  it('should prefill form when editing', async () => {
    const fixture = await createComponent({
      user: {
        id: 7,
        name: 'Maria Silva',
        email: 'maria@attus.dev',
        cpf: '12345678901',
        phone: '11999998888',
        phoneType: 'Celular',
      },
    });

    const component = fixture.componentInstance;

    expect(component['form'].getRawValue().name).toBe('Maria Silva');
    expect(component['form'].getRawValue().cpf).toBe('123.456.789-01');
  });

  it('should not submit invalid form', async () => {
    const fixture = await createComponent({ user: null });
    const component = fixture.componentInstance;

    component['save']();

    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('should normalize payload before closing dialog', async () => {
    const fixture = await createComponent({ user: null });
    const component = fixture.componentInstance;

    component['form'].setValue({
      name: '  Ana  ',
      email: 'ANA@EMAIL.COM',
      cpf: '123.456.789-01',
      phone: '(11) 98765-4321',
      phoneType: 'Celular',
    });

    component['save']();

    expect(dialogRefMock.close).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@email.com',
      cpf: '12345678901',
      phone: '11987654321',
      phoneType: 'Celular',
    });
  });
});
