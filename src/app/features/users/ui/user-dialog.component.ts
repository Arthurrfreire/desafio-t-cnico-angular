import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CPF_PATTERN,
  PHONE_PATTERN,
  PHONE_TYPES,
  SaveUserCommand,
  User,
  formatCpf,
  formatPhone,
  normalizeUserCommand,
} from '../models/user.model';

interface UserDialogData {
  readonly user: User | null;
}

@Component({
  selector: 'app-user-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserDialogComponent, SaveUserCommand | undefined>);
  protected readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  protected readonly phoneTypes = PHONE_TYPES;
  protected readonly title = this.data.user ? 'Editar usuário' : 'Novo usuário';
  protected readonly submitLabel = this.data.user ? 'Salvar alterações' : 'Criar usuário';

  protected readonly form = this.formBuilder.group({
    name: [this.data.user?.name ?? '', [Validators.required, Validators.minLength(3)]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    cpf: [this.data.user ? formatCpf(this.data.user.cpf) : '', [Validators.required, Validators.pattern(CPF_PATTERN)]],
    phone: [this.data.user ? formatPhone(this.data.user.phone) : '', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    phoneType: [this.data.user?.phoneType ?? PHONE_TYPES[0], Validators.required],
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    this.dialogRef.close(
      normalizeUserCommand({
        id: this.data.user?.id,
        name: rawValue.name,
        email: rawValue.email,
        cpf: rawValue.cpf,
        phone: rawValue.phone,
        phoneType: rawValue.phoneType,
      }),
    );
  }
}
