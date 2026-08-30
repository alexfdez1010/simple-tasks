'use client';

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { useActionState } from 'react';

import { loginAction, type LoginState } from '@/lib/auth/actions';
import { useI18n } from '@/lib/i18n/provider';

const INITIAL_STATE: LoginState = { error: null };

/** Renders the accessible shared-password login form and pending feedback. */
export function LoginForm(): React.JSX.Element {
  const [state, action, isPending] = useActionState(loginAction, INITIAL_STATE);
  const { t } = useI18n();
  const errorMessage = state.error ? t('auth.incorrectPassword') : null;
  return (
    <Form action={action} className="flex w-full flex-col gap-5">
      <TextField isInvalid={Boolean(errorMessage)} isRequired name="password">
        <Label>{t('auth.password')}</Label>
        <Input autoComplete="current-password" autoFocus type="password" />
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      </TextField>
      <Button fullWidth isPending={isPending} type="submit">
        {isPending ? t('auth.signingIn') : t('auth.signIn')}
      </Button>
    </Form>
  );
}
