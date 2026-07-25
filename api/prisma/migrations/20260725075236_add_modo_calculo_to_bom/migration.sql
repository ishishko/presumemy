-- CreateEnum
CREATE TYPE "ModoCalculoBOM" AS ENUM ('normal', 'fijo', 'extra');

-- AlterTable
ALTER TABLE "costo_producto_insumo" ADD COLUMN     "modo_calculo" "ModoCalculoBOM" NOT NULL DEFAULT 'normal';
