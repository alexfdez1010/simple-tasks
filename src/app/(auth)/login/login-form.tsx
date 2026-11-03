'use client';
import { Button, Form, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { safeReturnPath } from '@/lib/auth/navigation';
import { authCopy } from '@/components/auth/copy';
import { useI18n } from '@/lib/i18n/provider';

/** Signs in with Better Auth and completes TOTP or one-use recovery challenges. */
export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const { language } = useI18n();
  const copy = authCopy[language];
  const [challenge, setChallenge] = useState(false);
  const [backup, setBackup] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  /** Retains the signed OAuth query across both authentication factors. */
  async function submit(form: FormData) {
    setPending(true);
    setError(false);
    try {
      const next = safeReturnPath(
        new URLSearchParams(window.location.search).get('next'),
      );
      const result = challenge
        ? backup
          ? await authClient.twoFactor.verifyBackupCode({
              code: String(form.get('code')),
              trustDevice: false,
            })
          : await authClient.twoFactor.verifyTotp({
              code: String(form.get('code')),
              trustDevice: false,
            })
        : await authClient.signIn.email({
            email: String(form.get('email')),
            password: String(form.get('password')),
            callbackURL: next,
          });
      if (result.error) {
        setError(true);
        return;
      }
      if (
        result.data &&
        'twoFactorRedirect' in result.data &&
        result.data.twoFactorRedirect
      ) {
        setChallenge(true);
        return;
      }
      const url =
        result.data &&
        'url' in result.data &&
        typeof result.data.url === 'string'
          ? result.data.url
          : next;
      const destination = new URL(url, window.location.origin);
      if (destination.origin === window.location.origin) {
        router.replace(
          `${destination.pathname}${destination.search}${destination.hash}`,
        );
        router.refresh();
      } else window.location.assign(destination.href);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <Form action={submit} className="flex w-full flex-col gap-5">
      {challenge ? (
        <TextField key={backup ? 'backup' : 'totp'} isRequired name="code">
          <Label>{backup ? copy.backup : copy.code}</Label>
          <Input
            autoComplete="one-time-code"
            autoFocus
            inputMode={backup ? 'text' : 'numeric'}
            maxLength={backup ? 32 : 6}
          />
        </TextField>
      ) : (
        <>
          <TextField isRequired name="email" type="email">
            <Label>{copy.email}</Label>
            <Input autoComplete="username" autoFocus />
          </TextField>
          <TextField isRequired name="password">
            <Label>{copy.password}</Label>
            <Input autoComplete="current-password" type="password" />
          </TextField>
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {copy.invalid}
        </p>
      ) : null}
      <Button fullWidth isPending={pending} type="submit">
        {challenge ? copy.verify : copy.login}
      </Button>
      {challenge ? (
        <Button
          variant="tertiary"
          onPress={() => {
            setBackup(!backup);
            setError(false);
          }}
        >
          {backup ? copy.useTotp : copy.recovery}
        </Button>
      ) : null}
    </Form>
  );
}
