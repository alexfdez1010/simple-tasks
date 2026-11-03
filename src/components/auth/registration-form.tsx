'use client';
import {
  Button,
  Description,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOwnerInvitation } from '@/lib/auth/use-owner-invitation';
import { authClient } from '@/lib/auth/client';
import { OWNER_INVITATION_HEADER } from '@/lib/auth/registration-constants';
import { registrationCopy } from '@/components/auth/registration-copy';
import { useI18n } from '@/lib/i18n/provider';

/** Creates the owner's account through Better Auth with a user-chosen password and a fragment-only invitation. */
export function RegistrationForm() {
  const { language } = useI18n();
  const copy = registrationCopy[language];
  const router = useRouter();
  const invitation = useOwnerInvitation();
  const ready = invitation !== null;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<'mismatch' | 'failed' | null>(null);
  /** Confirms the new password, then delegates hashing, account creation and session issuance to Better Auth. */
  async function submit(form: FormData) {
    setError(null);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirmPassword'))) {
      setError('mismatch');
      return;
    }
    setPending(true);
    try {
      const result = await authClient.signUp.email({
        name: String(form.get('name')),
        email: String(form.get('email')),
        password,
        callbackURL: '/security',
        fetchOptions: {
          headers: { [OWNER_INVITATION_HEADER]: invitation ?? '' },
        },
      });
      if (result.error) {
        setError('failed');
        return;
      }
      router.replace('/security');
      router.refresh();
    } catch {
      setError('failed');
    } finally {
      setPending(false);
    }
  }
  /** Preserves entered account details after validation or server errors. */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit(new FormData(event.currentTarget));
  }
  if (ready && !invitation)
    return (
      <p role="alert" className="text-sm text-muted">
        {copy.invitation}
      </p>
    );
  return (
    <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField isRequired name="name" maxLength={80}>
        <Label>{copy.name}</Label>
        <Input autoComplete="name" autoFocus />
      </TextField>
      <TextField isRequired name="email" type="email">
        <Label>{copy.email}</Label>
        <Input autoComplete="username" />
      </TextField>
      <TextField isRequired name="password" minLength={12} maxLength={128}>
        <Label>{copy.password}</Label>
        <Input type="password" autoComplete="new-password" />
        <Description>{copy.minimum}</Description>
      </TextField>
      <TextField isRequired name="confirmPassword">
        <Label>{copy.confirm}</Label>
        <Input type="password" autoComplete="new-password" />
      </TextField>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {copy[error]}
        </p>
      ) : null}
      <Button
        fullWidth
        type="submit"
        isDisabled={!ready || !invitation}
        isPending={pending}
      >
        {copy.create}
      </Button>
    </Form>
  );
}
