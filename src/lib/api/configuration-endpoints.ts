import { statusService } from '@/lib/statuses';
import { propertyService } from '@/lib/properties';
import { notFound } from '@/lib/validation/errors';
import { endpoint } from '@/lib/api/endpoint';
import {
  emptyInput,
  propertiesReorder,
  propertyCreate,
  propertyUpdate,
  statusCreate,
  statusesReorder,
  statusUpdate,
} from '@/lib/api/schemas';

export const configurationEndpoints = [
  endpoint(
    'GET',
    '/statuses',
    'List workflow statuses in board order',
    emptyInput,
    'Statuses',
    () => statusService.list(),
  ),
  endpoint(
    'POST',
    '/statuses',
    'Append a workflow status',
    statusCreate,
    'Status',
    (input) => statusService.create(input),
  ),
  endpoint(
    'PUT',
    '/statuses/order',
    'Reorder all statuses; include every id exactly once',
    statusesReorder,
    'Empty',
    (input) => statusService.reorder(input),
  ),
  endpoint(
    'GET',
    '/statuses/{id}',
    'Get a workflow status',
    emptyInput,
    'Status',
    async (_, { id }) => {
      const status = (await statusService.list()).find(
        (item) => item.id === id,
      );
      if (!status) throw notFound('The status');
      return status;
    },
  ),
  endpoint(
    'PATCH',
    '/statuses/{id}',
    'Update name, color or terminal behavior',
    statusUpdate,
    'Status',
    (input, { id }) => statusService.update({ ...input, id }),
  ),
  endpoint(
    'DELETE',
    '/statuses/{id}',
    'Delete an empty status while retaining at least one',
    emptyInput,
    'Empty',
    (_, { id }) => statusService.delete(id),
  ),
  endpoint(
    'GET',
    '/properties',
    'List property definitions in display order',
    emptyInput,
    'Properties',
    () => propertyService.list(),
  ),
  endpoint(
    'POST',
    '/properties',
    'Append a typed property definition',
    propertyCreate,
    'Property',
    (input) => propertyService.create(input),
  ),
  endpoint(
    'PUT',
    '/properties/order',
    'Reorder all properties; include every id exactly once',
    propertiesReorder,
    'Empty',
    (input) => propertyService.reorder(input),
  ),
  endpoint(
    'GET',
    '/properties/{id}',
    'Get a property definition',
    emptyInput,
    'Property',
    async (_, { id }) => {
      const property = (await propertyService.list()).find(
        (item) => item.id === id,
      );
      if (!property) throw notFound('The property');
      return property;
    },
  ),
  endpoint(
    'PATCH',
    '/properties/{id}',
    'Update a property without invalidating existing values',
    propertyUpdate,
    'Property',
    (input, { id }) => propertyService.update({ ...input, id }),
  ),
  endpoint(
    'DELETE',
    '/properties/{id}',
    'Delete a property and all associated task values',
    emptyInput,
    'Empty',
    (_, { id }) => propertyService.delete(id),
  ),
];
