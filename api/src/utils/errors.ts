import type { FastifyReply, FastifyRequest } from 'fastify';

export type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'rate_limit_exceeded'
  | 'insufficient_credits'
  | 'system_busy'
  | 'conflict'
  | 'internal_server_error'
  | 'service_unavailable';

export function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details: Record<string, unknown> = {}
) {
  return reply.status(statusCode).send({
    error: {
      code,
      message,
      request_id: request.id,
      details
    }
  });
}
