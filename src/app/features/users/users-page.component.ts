import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, filter, startWith, switchMap } from 'rxjs';
import { UsersStore } from './data-access/users.store';
import { SaveUserCommand, User, formatCpf, formatPhone } from './models/user.model';
import { UserDialogComponent } from './ui/user-dialog.component';

@Component({
  selector: 'app-users-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersStore = inject(UsersStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly users = this.usersStore.users;
  protected readonly loading = this.usersStore.loading;
  protected readonly saving = this.usersStore.saving;
  protected readonly error = this.usersStore.error;
  protected readonly totalUsers = this.usersStore.totalUsers;
  protected readonly formatCpf = formatCpf;
  protected readonly formatPhone = formatPhone;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.getRawValue()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.usersStore.loadUsers(query)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
  }

  protected reload(): void {
    this.usersStore
      .loadUsers(this.searchControl.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected openCreateDialog(): void {
    this.openDialog();
  }

  protected openEditDialog(user: User): void {
    this.openDialog(user);
  }

  private openDialog(user?: User): void {
    this.dialog
      .open(UserDialogComponent, {
        data: { user: user ?? null },
        autoFocus: false,
        width: 'min(560px, calc(100vw - 2rem))',
      })
      .afterClosed()
      .pipe(
        filter((result: SaveUserCommand | undefined): result is SaveUserCommand => Boolean(result)),
        switchMap((result) => this.usersStore.saveUser(result)),
        switchMap(() => this.usersStore.loadUsers(this.searchControl.getRawValue())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(
            user ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.',
            'Fechar',
            { duration: 3000 },
          );
        },
        error: () => {
          this.snackBar.open(this.error() ?? 'Não foi possível salvar o usuário.', 'Fechar', {
            duration: 3500,
          });
        },
      });
  }
}
