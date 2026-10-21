'use client';
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from '@heroui/react';
import { useState, type FormEvent } from 'react';
import type { ApiCopy } from '@/components/api-access/copy';

/** Collects a token name and least-privilege access; preserves input on failed submission. */
export function TokenForm({
  copy,
  pending,
  onCreate,
}: {
  copy: ApiCopy;
  pending: boolean;
  onCreate: (name: string, canWrite: boolean) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [permission, setPermission] = useState('read');
  /** Submits explicitly chosen permissions and resets the name only after persistence. */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onCreate(name, permission === 'write')) setName('');
  }
  return (
    <form className="space-y-5" onSubmit={(event) => void submit(event)}>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{copy.formTitle}</h2>
        <p className="text-sm leading-6 text-muted">{copy.formHelp}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          isRequired
          isDisabled={pending}
          value={name}
          onChange={setName}
        >
          <Label>{copy.name}</Label>
          <Input
            className="min-h-11"
            maxLength={80}
            placeholder={copy.placeholder}
            autoComplete="off"
          />
          <FieldError />
        </TextField>
        <Select
          selectedKey={permission}
          isDisabled={pending}
          onSelectionChange={(key) => setPermission(String(key))}
        >
          <Label>{copy.permission}</Label>
          <Select.Trigger className="min-h-11">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="bg-surface text-foreground">
            <ListBox>
              <ListBox.Item id="read" textValue={copy.read}>
                {copy.read}
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="write" textValue={copy.write}>
                {copy.write}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
          <Description>
            {permission === 'write' ? copy.writeHelp : copy.readHelp}
          </Description>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="min-h-11"
          type="submit"
          isPending={pending}
          isDisabled={pending || !name.trim()}
        >
          {pending ? copy.creating : copy.create}
        </Button>
        <p className="text-sm text-muted">{copy.lifetime}</p>
      </div>
    </form>
  );
}
