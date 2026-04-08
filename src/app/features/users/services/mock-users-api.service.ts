import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { SaveUserCommand, User, normalizeUserCommand } from '../models/user.model';

export const MOCK_API_DELAY = 450;

const INITIAL_USERS: readonly User[] = [
  {
    id: 1,
    name: 'Ana Beatriz',
    email: 'ana.beatriz@attus.dev',
    cpf: '12345678901',
    phone: '11987654321',
    phoneType: 'Celular',
  },
  {
    id: 2,
    name: 'Bruno Lima',
    email: 'bruno.lima@attus.dev',
    cpf: '23456789012',
    phone: '1133456677',
    phoneType: 'Comercial',
  },
  {
    id: 3,
    name: 'Camila Torres',
    email: 'camila.torres@attus.dev',
    cpf: '34567890123',
    phone: '21999887766',
    phoneType: 'Celular',
  },
  {
    id: 4,
    name: 'Diego Martins',
    email: 'diego.martins@attus.dev',
    cpf: '45678901234',
    phone: '3132224455',
    phoneType: 'Residencial',
  },
  {
    id: 5,
    name: 'Fernanda Costa',
    email: 'fernanda.costa@attus.dev',
    cpf: '56789012345',
    phone: '41988776655',
    phoneType: 'Celular',
  },
];

@Injectable({
  providedIn: 'root',
})
export class MockUsersApiService {
  private users: User[] = [...INITIAL_USERS];

  listUsers(query = ''): Observable<readonly User[]> {
    const normalizedQuery = query.trim().toLowerCase();

    return timer(MOCK_API_DELAY).pipe(
      map(() => {
        if (normalizedQuery === 'erro') {
          throw new Error('Falha simulada ao listar usuários.');
        }

        return this.filterUsers(normalizedQuery);
      }),
    );
  }

  saveUser(command: SaveUserCommand): Observable<User> {
    const normalizedCommand = normalizeUserCommand(command);

    return timer(MOCK_API_DELAY).pipe(
      map(() => {
        if (normalizedCommand.email.includes('erro')) {
          throw new Error('Falha simulada ao salvar o usuário.');
        }

        const savedUser: User = {
          ...normalizedCommand,
          id: normalizedCommand.id ?? this.nextId(),
        };

        this.users = normalizedCommand.id
          ? this.users.map((user) => (user.id === normalizedCommand.id ? savedUser : user))
          : [savedUser, ...this.users];

        return { ...savedUser };
      }),
    );
  }

  reset(): void {
    this.users = [...INITIAL_USERS];
  }

  private filterUsers(query: string): readonly User[] {
    return this.users
      .filter((user) => user.name.toLowerCase().includes(query))
      .map((user) => ({ ...user }));
  }

  private nextId(): number {
    return Math.max(0, ...this.users.map((user) => user.id)) + 1;
  }
}
