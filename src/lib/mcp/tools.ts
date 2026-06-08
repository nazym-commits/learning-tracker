import { getDb } from '../db';

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const ITEM_TYPES = ['course', 'book', 'video', 'podcast'] as const;

const ITEM_SELECT = `
  id, title, author, type, progress,
  EXTRACT(EPOCH FROM created_at) * 1000 AS "createdAt"
`;

export const TOOLS: ToolDef[] = [
  {
    name: 'whoami',
    description: "Return the profile of the API key's owner. Useful to verify the connection.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_items',
    description: 'List the learning items owned by the user. Optionally filter by type.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: [...ITEM_TYPES], description: 'Filter by item type' },
        limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Max items to return' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_item',
    description: 'Get a single learning item by id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Item UUID' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_item',
    description: 'Create a new learning item.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1 },
        author: { type: 'string' },
        type: { type: 'string', enum: [...ITEM_TYPES] },
        progress: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['title', 'type'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_item',
    description: 'Update fields of an existing learning item. Only provided fields are changed.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string', minLength: 1 },
        author: { type: 'string' },
        type: { type: 'string', enum: [...ITEM_TYPES] },
        progress: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_item',
    description: 'Delete a learning item by id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_stats',
    description: 'Aggregate stats for the user: counts per type and average/total progress.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

export class ToolError extends Error {}

type Args = Record<string, unknown>;

function assertType(value: unknown): string {
  if (typeof value !== 'string' || !ITEM_TYPES.includes(value as (typeof ITEM_TYPES)[number])) {
    throw new ToolError(`type must be one of: ${ITEM_TYPES.join(', ')}`);
  }
  return value;
}

function assertProgress(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    throw new ToolError('progress must be an integer between 0 and 100');
  }
  return n;
}

function assertId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ToolError('id is required');
  }
  return value;
}

/** Execute a tool scoped to a single user. Returns a JSON-serializable result. */
export async function callTool(userId: string, name: string, args: Args): Promise<unknown> {
  const sql = getDb();

  switch (name) {
    case 'whoami': {
      const rows = await sql`
        SELECT id, email, name, EXTRACT(EPOCH FROM created_at) * 1000 AS "createdAt"
        FROM users WHERE id = ${userId}
      `;
      if (rows.length === 0) throw new ToolError('user not found');
      return rows[0];
    }

    case 'list_items': {
      const limit = args.limit === undefined ? 100 : Math.min(Math.max(Number(args.limit), 1), 200);
      if (args.type !== undefined) {
        const type = assertType(args.type);
        return sql`
          SELECT ${sql.unsafe(ITEM_SELECT)}
          FROM learning_items
          WHERE user_id = ${userId} AND type = ${type}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
      }
      return sql`
        SELECT ${sql.unsafe(ITEM_SELECT)}
        FROM learning_items
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    case 'get_item': {
      const id = assertId(args.id);
      const rows = await sql`
        SELECT ${sql.unsafe(ITEM_SELECT)}
        FROM learning_items
        WHERE id = ${id} AND user_id = ${userId}
      `;
      if (rows.length === 0) throw new ToolError('item not found');
      return rows[0];
    }

    case 'create_item': {
      if (typeof args.title !== 'string' || args.title.trim().length === 0) {
        throw new ToolError('title is required');
      }
      const type = assertType(args.type);
      const author = typeof args.author === 'string' ? args.author : '';
      const progress = args.progress === undefined ? 0 : assertProgress(args.progress);
      const rows = await sql`
        INSERT INTO learning_items (user_id, title, author, type, progress)
        VALUES (${userId}, ${args.title.trim()}, ${author}, ${type}, ${progress})
        RETURNING ${sql.unsafe(ITEM_SELECT)}
      `;
      return rows[0];
    }

    case 'update_item': {
      const id = assertId(args.id);
      const sets: string[] = [];
      const values: unknown[] = [];
      if (args.title !== undefined) {
        if (typeof args.title !== 'string' || args.title.trim().length === 0) {
          throw new ToolError('title must be a non-empty string');
        }
        sets.push('title');
        values.push(args.title.trim());
      }
      if (args.author !== undefined) {
        sets.push('author');
        values.push(typeof args.author === 'string' ? args.author : '');
      }
      if (args.type !== undefined) {
        sets.push('type');
        values.push(assertType(args.type));
      }
      if (args.progress !== undefined) {
        sets.push('progress');
        values.push(assertProgress(args.progress));
      }
      if (sets.length === 0) throw new ToolError('provide at least one field to update');

      const assignments = sets.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const rows = await sql.query(
        `UPDATE learning_items SET ${assignments}
         WHERE id = $${sets.length + 1} AND user_id = $${sets.length + 2}
         RETURNING id, title, author, type, progress,
                   EXTRACT(EPOCH FROM created_at) * 1000 AS "createdAt"`,
        [...values, id, userId],
      );
      if (rows.length === 0) throw new ToolError('item not found');
      return rows[0];
    }

    case 'delete_item': {
      const id = assertId(args.id);
      const rows = await sql`
        DELETE FROM learning_items
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;
      if (rows.length === 0) throw new ToolError('item not found');
      return { deleted: true, id };
    }

    case 'get_stats': {
      const rows = await sql`
        SELECT type, COUNT(*)::int AS count, ROUND(AVG(progress))::int AS avg_progress
        FROM learning_items
        WHERE user_id = ${userId}
        GROUP BY type
      `;
      const totalRows = await sql`
        SELECT COUNT(*)::int AS total, COALESCE(ROUND(AVG(progress)), 0)::int AS avg_progress
        FROM learning_items
        WHERE user_id = ${userId}
      `;
      return {
        total: totalRows[0].total,
        avgProgress: totalRows[0].avg_progress,
        byType: rows,
      };
    }

    default:
      throw new ToolError(`unknown tool: ${name}`);
  }
}
