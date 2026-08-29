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

const INITIAL_STATE: LoginState = { error: null };

/** Renders the accessible shared-password login form and pending feedback. */
export function LoginForm(): React.JSX.Element {
  const [state, action, isPending] = useActionState(loginAction, INITIAL_STATE);
  return (
    <Form action={action} className="flex w-full flex-col gap-5">
      <TextField isInvalid={Boolean(state.error)} isRequired name="password">
        <Label>Contraseña</Label>
        <Input autoComplete="current-password" autoFocus type="password" />
        {state.error ? <FieldError>{state.error}</FieldError> : null}
      </TextField>
      <Button fullWidth isPending={isPending} type="submit">
        {isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </Form>
  );
}
