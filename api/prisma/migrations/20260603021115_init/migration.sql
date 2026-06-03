-- CreateEnum
CREATE TYPE "TipoGanancia" AS ENUM ('porcentaje', 'fijo');

-- CreateEnum
CREATE TYPE "TipoLineaBOM" AS ENUM ('insumo', 'cameo', 'embalaje', 'extra');

-- CreateEnum
CREATE TYPE "CanalType" AS ENUM ('instagram', 'whatsapp', 'mail', 'otros');

-- CreateEnum
CREATE TYPE "EstadoPresupuesto" AS ENUM ('borrador', 'enviado', 'en_curso', 'cerrado', 'facturado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('retira', 'envio');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('venta_producto', 'venta_presupuesto', 'cobro_cliente', 'compra_insumo', 'pago_servicio', 'pago_imprenta', 'pago_alquiler', 'pago_sueldo', 'retiro_socio', 'deposito', 'ajuste_positivo', 'ajuste_negativo');

-- CreateEnum
CREATE TYPE "CuentaType" AS ENUM ('efectivo', 'banco', 'tarjeta', 'billetera');

-- CreateTable
CREATE TABLE "configuracion_negocio" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL DEFAULT 'MemyDeni',
    "logo_url" TEXT,
    "domicilio" JSONB,
    "contacto_canal" TEXT,
    "contacto_valor" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "cancelacion_auto" BOOLEAN NOT NULL DEFAULT false,
    "dias_espera" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "configuracion_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_insumo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "unidad" TEXT NOT NULL,
    "stock" DECIMAL(10,2) NOT NULL,
    "stock_minimo" DECIMAL(10,2) NOT NULL,
    "costo_paquete" DECIMAL(10,2) NOT NULL,
    "cantidad_pack" DECIMAL(10,2) NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumo_proveedor" (
    "id" SERIAL NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "precio" DECIMAL(10,2),

    CONSTRAINT "insumo_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "tiene_bom" BOOLEAN NOT NULL DEFAULT false,
    "tipo_ganancia" "TipoGanancia" NOT NULL DEFAULT 'porcentaje',
    "ganancia" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costo_producto_insumo" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "tipo_linea" "TipoLineaBOM" NOT NULL,
    "insumo_id" INTEGER,
    "descripcion" TEXT,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "costo_producto_insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "domicilio" JSONB,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_contactos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "canal" "CanalType" NOT NULL,
    "valor" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cliente_contactos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" SERIAL NOT NULL,
    "folio" TEXT NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "tematica" TEXT,
    "estado" "EstadoPresupuesto" NOT NULL DEFAULT 'borrador',
    "tipo_entrega" "TipoEntrega" NOT NULL DEFAULT 'retira',
    "direccion_entrega" TEXT,
    "fecha_entrega" TIMESTAMP(3),
    "sena" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_presupuesto" (
    "id" SERIAL NOT NULL,
    "presupuesto_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "detalle_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribucion_ganancias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "distribucion_ganancias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cuenta" "CuentaType" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "referencia" TEXT,
    "detalle" TEXT,
    "nro_factura" TEXT,
    "presupuesto_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_imprenta" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "presupuesto_id" INTEGER,
    "producto_id" INTEGER,
    "tematica" TEXT,
    "hojas" INTEGER NOT NULL,
    "tipo_hoja" TEXT NOT NULL,
    "valor_unitario" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "diferencia" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ordenes_imprenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insumos_codigo_key" ON "insumos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_proveedor_insumo_id_proveedor_id_key" ON "insumo_proveedor"("insumo_id", "proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_folio_key" ON "presupuestos"("folio");

-- AddForeignKey
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumo_proveedor" ADD CONSTRAINT "insumo_proveedor_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insumo_proveedor" ADD CONSTRAINT "insumo_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costo_producto_insumo" ADD CONSTRAINT "costo_producto_insumo_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costo_producto_insumo" ADD CONSTRAINT "costo_producto_insumo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_contactos" ADD CONSTRAINT "cliente_contactos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_presupuesto" ADD CONSTRAINT "detalle_presupuesto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_presupuesto" ADD CONSTRAINT "detalle_presupuesto_presupuesto_id_fkey" FOREIGN KEY ("presupuesto_id") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_presupuesto_id_fkey" FOREIGN KEY ("presupuesto_id") REFERENCES "presupuestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_imprenta" ADD CONSTRAINT "ordenes_imprenta_presupuesto_id_fkey" FOREIGN KEY ("presupuesto_id") REFERENCES "presupuestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_imprenta" ADD CONSTRAINT "ordenes_imprenta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
