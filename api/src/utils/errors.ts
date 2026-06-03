import { HTTPException } from 'hono/http-exception'

export function notFound(message = 'Recurso no encontrado') {
  return new HTTPException(404, { message })
}

export function unauthorized(message = 'No autorizado') {
  return new HTTPException(401, { message })
}

export function forbidden(message = 'Acción no permitida') {
  return new HTTPException(403, { message })
}

export function badRequest(message = 'Datos inválidos') {
  return new HTTPException(400, { message })
}

export function conflict(message = 'Conflicto de datos') {
  return new HTTPException(409, { message })
}

export function serverError(message = 'Error interno del servidor') {
  return new HTTPException(500, { message })
}
