'use client';
import { Button, Checkbox, Form, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { authClient } from '@/lib/auth/client';
import { authCopy } from '@/components/auth/copy';
import { useI18n } from '@/lib/i18n/provider';

type Enrollment = { qr: string; secret: string; codes: string[] };

/** Enrolls TOTP locally without sending secrets to a QR service; requires code verification. */
export function Enrollment() {
  const router = useRouter();
  const { language } = useI18n();
  const copy = authCopy[language];
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  /** Starts password-confirmed enrollment or validates its first TOTP code. */
  async function submit(form: FormData) {
    setPending(true);
    setError(false);
    try {
      if (enrollment) {
        const result = await authClient.twoFactor.verifyTotp({
          code: String(form.get('code')),
          trustDevice: false,
        });
        if (result.error) {
          setError(true);
          return;
        }
        setVerified(true);
      } else {
        const result = await authClient.twoFactor.enable({
          password: String(form.get('password')),
        });
        if (result.error || !result.data || !('totpURI' in result.data)) {
          setError(true);
          return;
        }
        const { totpURI, backupCodes } = result.data;
        setEnrollment({
          qr: await QRCode.toDataURL(totpURI, { width: 256, margin: 2 }),
          secret: new URL(totpURI).searchParams.get('secret') ?? '',
          codes: backupCodes,
        });
      }
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  /** Resumes a pending OAuth request only after 2FA is verified and recovery codes saved. */
  async function finish() {
    setPending(true);
    setError(false);
    try {
      if (new URLSearchParams(window.location.search).has('client_id')) {
        const result = await authClient.oauth2.continue({ postLogin: true });
        if (result.error) {
          setError(true);
          return;
        }
        window.location.assign(result.data.url);
      } else router.replace('/');
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-5">
      {enrollment ? (
        <>
          {!verified ? (
            <>
              <p className="text-sm text-muted">{copy.setupHelp}</p>
              {/* QR is generated in memory and deliberately remains outside Next image caching. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollment.qr}
                alt="QR TOTP"
                width={256}
                height={256}
                className="mx-auto max-w-full rounded-lg"
              />
              <TextField isReadOnly>
                <Label>{copy.key}</Label>
                <Input value={enrollment.secret} className="font-mono" />
              </TextField>
            </>
          ) : (
            <p role="status">{copy.active}</p>
          )}
          <p className="text-sm text-muted">{copy.saveCodes}</p>
          <ul
            aria-label={copy.backup}
            className="grid grid-cols-2 gap-2 font-mono text-sm"
          >
            {enrollment.codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </>
      ) : null}
      {verified ? (
        <>
          <Checkbox isSelected={saved} onChange={setSaved}>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>{copy.saved}</Checkbox.Content>
          </Checkbox>
          <Button
            fullWidth
            isDisabled={!saved}
            isPending={pending}
            onPress={finish}
          >
            {copy.continue}
          </Button>
        </>
      ) : (
        <Form action={submit} className="flex flex-col gap-5">
          {enrollment ? (
            <TextField isRequired name="code">
              <Label>{copy.code}</Label>
              <Input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
            </TextField>
          ) : (
            <TextField isRequired name="password">
              <Label>{copy.password}</Label>
              <Input type="password" autoComplete="current-password" />
            </TextField>
          )}
          <Button fullWidth type="submit" isPending={pending}>
            {enrollment ? copy.verify : copy.start}
          </Button>
        </Form>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {copy.invalid}
        </p>
      ) : null}
    </div>
  );
}
