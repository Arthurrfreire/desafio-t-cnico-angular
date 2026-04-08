import { formatCpf, formatPhone, normalizeUserCommand, onlyDigits } from './user.model';

describe('user.model helpers', () => {
  it('should keep only digits', () => {
    expect(onlyDigits('123.456-78')).toBe('12345678');
  });

  it('should format cpf and phone values', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('should normalize command payload', () => {
    expect(
      normalizeUserCommand({
        name: '  Ana  ',
        email: '  ANA@EMAIL.COM  ',
        cpf: '123.456.789-01',
        phone: '(11) 98765-4321',
        phoneType: 'Celular',
      }),
    ).toEqual({
      name: 'Ana',
      email: 'ana@email.com',
      cpf: '12345678901',
      phone: '11987654321',
      phoneType: 'Celular',
    });
  });
});
