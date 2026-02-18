import type { FastifyReply, FastifyRequest } from 'fastify';

export type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'rate_limit_exceeded'
  | 'internal_server_error';

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
