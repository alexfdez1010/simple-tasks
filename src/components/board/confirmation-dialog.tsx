'use client';

import { AlertDialog, Button } from '@heroui/react';
import { useState } from 'react';

interface ConfirmationDialogProps {
  body: string;
  confirmLabel: string;
  heading: string;
  triggerAriaLabel?: string;
  triggerLabel: string;
  triggerVariant?: 'danger' | 'danger-soft' | 'ghost';
  onConfirm: () => Promise<boolean>;
}

/**
 * Renders a controlled HeroUI confirmation flow for destructive actions.
 *
 * @param props - Dialog copy, trigger presentation, and async confirmation.
 * @returns A trigger button and accessible alert dialog.
 */
export function ConfirmationDialog({
  body,
  confirmLabel,
  heading,
  triggerAriaLabel,
  triggerLabel,
  triggerVariant = 'danger',
  onConfirm,
}: ConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  /** Runs the destructive action and closes only after successful persistence. */
  async function handleConfirm(): Promise<void> {
    setIsPending(true);
    const didSucceed = await onConfirm();
    setIsPending(false);
    if (didSucceed) setIsOpen(false);
  }

  return (
    <>
      <Button
        size="sm"
        variant={triggerVariant}
        aria-label={triggerAriaLabel}
        onPress={() => setIsOpen(true)}
      >
        {triggerLabel}
      </Button>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <AlertDialog.Container placement="center" size="sm">
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{heading}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>{body}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                isPending={isPending}
                variant="danger"
                onPress={() => void handleConfirm()}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}
