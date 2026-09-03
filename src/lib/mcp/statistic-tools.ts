import 'server-only';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
  StatisticColor,
  StatisticDateBucket,
  StatisticDateField,
  StatisticDateRange,
  StatisticGroupBy,
  StatisticMeasure,
  StatisticSize,
  StatisticScope,
  StatisticVisualization,
} from '@/generated/prisma';
import { runMcpTool } from '@/lib/mcp/shared';
import { statisticsService } from '@/lib/statistics';
import { MAX_STATISTICS } from '@/lib/statistics/limits';
import { idSchema } from '@/lib/validation/common';

const nullableId = idSchema.nullable();
const fields = {
  color: z.nativeEnum(StatisticColor),
  dateBucket: z.nativeEnum(StatisticDateBucket).nullable(),
  dateField: z.nativeEnum(StatisticDateField).nullable(),
  datePropertyId: nullableId,
  dateRange: z.nativeEnum(StatisticDateRange),
  groupBy: z.nativeEnum(StatisticGroupBy),
  groupPropertyId: nullableId,
  measure: z.nativeEnum(StatisticMeasure),
  measurePropertyId: nullableId,
  name: z.string().trim().min(1).max(100),
  scope: z.nativeEnum(StatisticScope),
  size: z.nativeEnum(StatisticSize),
  statusIds: z.array(idSchema).max(50),
  visualization: z.nativeEnum(StatisticVisualization),
};
const createFields = {
  ...fields,
  color: fields.color.default(StatisticColor.FOREST),
  dateBucket: fields.dateBucket.default(null),
  dateField: fields.dateField.default(null),
  datePropertyId: fields.datePropertyId.default(null),
  dateRange: fields.dateRange.default(StatisticDateRange.ALL_TIME),
  groupBy: fields.groupBy.default(StatisticGroupBy.NONE),
  groupPropertyId: fields.groupPropertyId.default(null),
  measure: fields.measure.default(StatisticMeasure.COUNT),
  measurePropertyId: fields.measurePropertyId.default(null),
  scope: fields.scope.default(StatisticScope.ALL),
  size: fields.size.default(StatisticSize.AUTO),
  statusIds: fields.statusIds.default([]),
  visualization: fields.visualization.default(StatisticVisualization.KPI),
};

/** Registers statistics reads and configurable widget mutations. */
export function registerStatisticTools(server: McpServer): void {
  server.registerTool(
    'get_statistics',
    {
      title: 'Get calculated statistics',
      description:
        'Return every configured widget with its current calculated result.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => runMcpTool(() => statisticsService.getSnapshot()),
  );
  server.registerTool(
    'list_statistics',
    {
      title: 'List statistic definitions',
      description: 'Return configurable statistic definitions in canvas order.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => runMcpTool(() => statisticsService.list()),
  );
  server.registerTool(
    'create_statistic',
    {
      title: 'Create a statistic',
      description:
        'Add a KPI, bar, donut, or line widget. Sending only name creates an all-task count KPI with FOREST color and AUTO size. Colors: FOREST, OCEAN, IRIS, AMBER, CORAL, GRAPHITE. Sizes: AUTO, COMPACT, SQUARE, WIDE, FULL. Relative date ranges require dateField; numeric measures require a NUMBER property; lines require a date dimension.',
      inputSchema: createFields,
    },
    async (input) => runMcpTool(() => statisticsService.create(input)),
  );
  server.registerTool(
    'update_statistic',
    {
      title: 'Update a statistic',
      description:
        'Edit selected fields of a statistic while preserving omitted fields.',
      inputSchema: {
        id: idSchema,
        color: fields.color.optional(),
        dateBucket: fields.dateBucket.optional(),
        dateField: fields.dateField.optional(),
        datePropertyId: fields.datePropertyId.optional(),
        dateRange: fields.dateRange.optional(),
        groupBy: fields.groupBy.optional(),
        groupPropertyId: fields.groupPropertyId.optional(),
        measure: fields.measure.optional(),
        measurePropertyId: fields.measurePropertyId.optional(),
        name: fields.name.optional(),
        scope: fields.scope.optional(),
        size: fields.size.optional(),
        statusIds: fields.statusIds.optional(),
        visualization: fields.visualization.optional(),
      },
    },
    async (input) => runMcpTool(() => statisticsService.update(input)),
  );
  server.registerTool(
    'reorder_statistics',
    {
      title: 'Reorder statistics',
      description: 'Set the complete ordered list of statistic ids.',
      inputSchema: { statisticIds: z.array(idSchema).max(MAX_STATISTICS) },
    },
    async (input) =>
      runMcpTool(async () => {
        await statisticsService.reorder(input);
        return { reordered: input.statisticIds };
      }),
  );
  server.registerTool(
    'delete_statistic',
    {
      title: 'Delete a statistic',
      description:
        'Delete a configured statistic. Confirm with the user first.',
      inputSchema: { id: idSchema },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      runMcpTool(async () => {
        await statisticsService.delete(id);
        return { deleted: id };
      }),
  );
}
