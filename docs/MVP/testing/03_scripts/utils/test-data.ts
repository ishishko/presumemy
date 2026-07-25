/**
 * Datos de prueba para tests E2E
 * Centraliza todos los datos usados en los specs
 */

export const TEST_CONFIG = {
  email: 'shimbo@test.com',
  password: 'shimbo123',
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3000',
};

export const TEST_INSUMO = {
  nombre: 'Papel Seda Blanco',
  categoria: 'Papel',
  unidad: 'pliego',
  stockActual: 50,
  stockMinimo: 20,
  costoPaquete: 100,
};

export const TEST_PRODUCTO = {
  nombre: 'Caja de Regalo Premium',
  categoria: 'Empaque',
  descripcion: 'Caja decorativa para regalos',
  precio: 250,
  medidas: {
    base: 20,
    altura: 15,
    profundidad: 10,
  },
};

export const TEST_CLIENTE = {
  nombre: 'Cliente Test',
  email: 'test@example.com',
  telefono: '1234567890',
  domicilio: {
    calle: 'Calle Test',
    numero: '123',
    localidad: 'Ciudad Test',
    provincia: 'Provincia Test',
  },
};

export const TEST_PRESUPUESTO = {
  cliente: 'Andrea Vázquez',
  tematica: 'Cumpleaños Test',
  fechaFiesta: '2026-12-15',
  fechaEntrega: '2026-12-10',
  metodoPago: 'Transferencia',
  sena: 100,
  notas: 'Notas de prueba para el presupuesto',
};

export const TEST_MOVIMIENTO = {
  tipo: 'venta_producto',
  cuenta: 'Efectivo',
  monto: 500,
  detalle: 'Venta de producto de prueba',
};

/**
 * Genera un nombre único para evitar colisiones en tests
 */
export function uniqueName(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix} ${timestamp}`;
}

/**
 * Genera un email único para evitar colisiones en tests
 */
export function uniqueEmail(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix}${timestamp}@test.com`;
}
