'use client';
import { Button, Form, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changeOwnerPassword } from '@/lib/auth/password';
import { useI18n } from '@/lib/i18n/provider';

/** Requires a strong replacement for legacy passwords before granting board or OAuth access. */
export function PasswordChange() {
  const router = useRouter();
  const { language } = useI18n();
  const es = language === 'es';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  /** Confirms matching passwords and delegates hashing and verification to Better Auth. */
  async function submit(form: FormData) {
    const password = String(form.get('newPassword'));
    if (password !== String(form.get('confirmPassword'))) {
      setError(true);
      return;
    }
    setPending(true);
    setError(false);
    try {
      if (
        await changeOwnerPassword(String(form.get('currentPassword')), password)
      ) {
        router.replace('/login');
        router.refresh();
      } else setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <Form action={submit} className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        {es
          ? 'Elige una contraseña de al menos 12 caracteres. Después tendrás que volver a iniciar sesión.'
          : 'Choose a password with at least 12 characters. You will need to sign in again.'}
      </p>
      <TextField isRequired name="currentPassword">
        <Label>{es ? 'Contraseña actual' : 'Current password'}</Label>
        <Input type="password" autoComplete="current-password" />
      </TextField>
      <TextField isRequired name="newPassword" minLength={12} maxLength={128}>
        <Label>{es ? 'Nueva contraseña' : 'New password'}</Label>
        <Input type="password" autoComplete="new-password" />
      </TextField>
      <TextField isRequired name="confirmPassword">
        <Label>{es ? 'Repetir contraseña' : 'Confirm password'}</Label>
        <Input type="password" autoComplete="new-password" />
      </TextField>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {es
            ? 'Comprueba la contraseña actual y que las nuevas coincidan.'
            : 'Check your current password and ensure the new passwords match.'}
        </p>
      ) : null}
      <Button type="submit" fullWidth isPending={pending}>
        {es ? 'Cambiar contraseña' : 'Change password'}
      </Button>
    </Form>
  );
}
