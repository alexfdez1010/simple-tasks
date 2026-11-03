'use client';
import { Button, Description, Label, Radio, RadioGroup } from '@heroui/react';
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { authCopy } from '@/components/auth/copy';
import { consentScopes } from '@/lib/mcp/permissions';
import { useI18n } from '@/lib/i18n/provider';

/** Lets the owner reduce the signed OAuth request to read-only or full access. */
export function ConsentForm({
  name,
  scopes,
}: {
  name: string;
  scopes: string[];
}) {
  const { language } = useI18n();
  const copy = authCopy[language];
  const [mode, setMode] = useState('read');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  /** Submits explicit scope-limited consent and follows Better Auth's validated redirect. */
  async function submit(accept: boolean) {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.oauth2.consent({
        accept,
        scope: consentScopes(scopes, mode === 'full').join(' '),
      });
      if (result.error) {
        setError(true);
        return;
      }
      window.location.assign(result.data.url);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-6">
      <p className="break-all font-medium">{name}</p>
      <RadioGroup value={mode} onChange={setMode} aria-label={copy.permissions}>
        <Label>{copy.permissions}</Label>
        <Radio value="read">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.read}
          </Radio.Content>
          <Description>{copy.readHelp}</Description>
        </Radio>
        <Radio value="full" isDisabled={!scopes.includes('tasks:write')}>
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.full}
          </Radio.Content>
          <Description>{copy.fullHelp}</Description>
        </Radio>
      </RadioGroup>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {copy.invalid}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button isPending={pending} onPress={() => submit(true)}>
          {copy.authorize}
        </Button>
        <Button
          variant="tertiary"
          isDisabled={pending}
          onPress={() => submit(false)}
        >
          {copy.deny}
        </Button>
      </div>
    </div>
  );
}
