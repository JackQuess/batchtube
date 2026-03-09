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
  | 'service_unavailable'
  // Plan / entitlement errors
  | 'plan_limit_reached'
  | 'playlist_too_large_for_plan'
  | 'channel_archive_not_allowed'
  | 'api_access_not_allowed'
  | 'cli_access_not_allowed'
  | 'automation_not_allowed'
  | 'upscale_4k_not_allowed'
  | 'advanced_processing_not_allowed'
  | 'quality_not_allowed_for_plan';

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
