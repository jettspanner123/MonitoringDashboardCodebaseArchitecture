import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import ValidationCException from '../Exceptions/ValidationCException';
import EntityNotFoundCException from '../Exceptions/EntityNotFoundCException';
import ApiResponseClass from '../Models/Classes/ApiResponseClass';

export default function GlobalExceptionHandlingMiddleware(
    error: FastifyError | Error,
    _request: FastifyRequest,
    reply: FastifyReply
): void {
    if (error instanceof ValidationCException) {
        reply.status(400).send(ApiResponseClass.failed(error.message, error.validationErrors, 400));
        return;
    }

    if (error instanceof EntityNotFoundCException) {
        reply.status(404).send(ApiResponseClass.failed(error.message, [error.message], 404));
        return;
    }

    reply.status(500).send(ApiResponseClass.failed('An unexpected error occurred.', [error.message], 500));
}
