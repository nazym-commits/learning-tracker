import { resolveApiKey } from '@/lib/api-keys';
import { TOOLS, callTool, ToolError } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SERVER_INFO = { name: 'learning-tracker', version: '1.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

interface RpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: RpcRequest['id'], result: unknown) {
  return Response.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function rpcError(id: RpcRequest['id'], code: number, message: string, status = 200) {
  return Response.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { status });
}

async function handleRpc(req: RpcRequest, userId: string): Promise<Response | null> {
  switch (req.method) {
    case 'initialize': {
      const requested = (req.params?.protocolVersion as string) || DEFAULT_PROTOCOL;
      return rpcResult(req.id, {
        protocolVersion: requested,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }

    case 'notifications/initialized':
      // Notification: no response body.
      return null;

    case 'ping':
      return rpcResult(req.id, {});

    case 'tools/list':
      return rpcResult(req.id, { tools: TOOLS });

    case 'tools/call': {
      const name = req.params?.name as string;
      const args = (req.params?.arguments as Record<string, unknown>) ?? {};
      if (!name) return rpcError(req.id, -32602, 'Missing tool name');
      try {
        const result = await callTool(userId, name, args);
        return rpcResult(req.id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      } catch (err) {
        const message = err instanceof ToolError ? err.message : 'Tool execution failed';
        if (!(err instanceof ToolError)) console.error('MCP tool error:', err);
        return rpcResult(req.id, {
          content: [{ type: 'text', text: message }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(req.id, -32601, `Method not found: ${req.method}`);
  }
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  const resolved = await resolveApiKey(apiKey);
  if (!resolved) {
    return rpcError(null, -32001, 'Unauthorized: invalid or missing x-api-key', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error', 400);
  }

  if (Array.isArray(body)) {
    // Batch: collect non-notification responses.
    const responses: unknown[] = [];
    for (const item of body) {
      const res = await handleRpc(item as RpcRequest, resolved.userId);
      if (res) responses.push(await res.json());
    }
    if (responses.length === 0) return new Response(null, { status: 202 });
    return Response.json(responses);
  }

  const req = body as RpcRequest;
  if (!req || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return rpcError((req as RpcRequest)?.id ?? null, -32600, 'Invalid Request', 400);
  }

  const res = await handleRpc(req, resolved.userId);
  if (!res) return new Response(null, { status: 202 });
  return res;
}
