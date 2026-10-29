import { requireAuthenticated } from '@/lib/auth/session';
import { CoordinationPrototype } from '@/components/coordination-preview/prototype';
import '@/components/workspace/workspace.css';

/** Shows the minimalist dependency-graph preview without reading or changing the live task board. */
export default async function DesignPreview() {
  await requireAuthenticated();
  return <CoordinationPrototype />;
}
