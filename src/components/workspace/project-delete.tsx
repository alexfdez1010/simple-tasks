'use client';

import { AlertDialog, Button } from '@heroui/react';
import { useState } from 'react';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { useWorkspaceCopy } from '@/components/workspace/copy';
import { deleteProjectAction } from '@/lib/coordination/actions';

type Project = { id: string; name: string };

/** Confirms project removal and an explicit task destination; failed requests retain the user's choice. */
export function ProjectDelete({
  project,
  projects,
  onSaved,
}: {
  project: Project;
  projects: Project[];
  onSaved: () => void;
}) {
  const copy = useWorkspaceCopy();
  const destinations = projects.filter(
    (candidate) => candidate.id !== project.id,
  );
  const preferred =
    destinations.find(
      (candidate) => candidate.name.toLocaleLowerCase() === 'miscelánea',
    ) ?? destinations[0];
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState(preferred?.id ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const protectedProject =
    project.id === 'project-general' || !destinations.length;
  const validDestination = destinations.some(
    (candidate) => candidate.id === destination,
  );

  /** Removes only after the service atomically moves every task; no optimistic data is discarded. */
  async function remove() {
    if (!validDestination || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await deleteProjectAction({
        id: project.id,
        destinationProjectId: destination,
      });
      if (result.success) {
        setOpen(false);
        onSaved();
      } else setError(result.error);
    } catch {
      setError(copy.deleteProjectFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        className="text-danger"
        isDisabled={protectedProject}
        aria-label={`${copy.deleteProject} ${project.name}`}
        aria-description={protectedProject ? copy.protectedProject : undefined}
        onPress={() => {
          setError(null);
          setDestination(preferred?.id ?? '');
          setOpen(true);
        }}
      >
        {copy.deleteProject}
      </Button>
      <AlertDialog.Backdrop
        isOpen={open}
        isDismissable={false}
        isKeyboardDismissDisabled={pending}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <AlertDialog.Container size="sm" placement="auto">
          <AlertDialog.Dialog className="workspace-theme rounded-2xl">
            <AlertDialog.CloseTrigger isDisabled={pending} />
            <AlertDialog.Header>
              <AlertDialog.Heading className="break-words">
                {copy.deleteProject}: {project.name}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-5">
              <p className="text-sm leading-6 text-muted">
                {copy.deleteProjectHelp}
              </p>
              <StatisticSelect
                label={copy.moveTasksTo}
                value={destination}
                onChange={setDestination}
                options={destinations.map((candidate) => ({
                  id: candidate.id,
                  label: candidate.name,
                }))}
              />
              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button
                variant="tertiary"
                isDisabled={pending}
                onPress={() => setOpen(false)}
              >
                {copy.cancel}
              </Button>
              <Button
                variant="danger"
                isPending={pending}
                isDisabled={!validDestination}
                onPress={() => void remove()}
              >
                {copy.deleteProject}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}
