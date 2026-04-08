export type PhoneType = 'Celular' | 'Residencial' | 'Comercial';

export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly cpf: string;
  readonly phone: string;
  readonly phoneType: PhoneType;
}

export type SaveUserCommand = Omit<User, 'id'> & {
  readonly id?: number;
};

export const PHONE_TYPES: readonly PhoneType[] = ['Celular', 'Residencial', 'Comercial'];

export const CPF_PATTERN = /^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;
export const PHONE_PATTERN = /^(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length !== 11) {
    return value;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value);

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return value;
}

export function normalizeUserCommand(command: SaveUserCommand): SaveUserCommand {
  return {
    ...command,
    name: command.name.trim(),
    email: command.email.trim().toLowerCase(),
    cpf: onlyDigits(command.cpf),
    phone: onlyDigits(command.phone),
  };
}
