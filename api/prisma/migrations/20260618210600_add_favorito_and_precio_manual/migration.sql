-- AlterTable
ALTER TABLE "presupuestos" ADD COLUMN     "fecha_finalizacion" TIMESTAMP(3),
ADD COLUMN     "notas_publicas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pdf_generated_at" TIMESTAMP(3),
ADD COLUMN     "pdf_path" TEXT,
ADD COLUMN     "public_token" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "favorito" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precio_manual" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tiene_bom" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_public_token_key" ON "presupuestos"("public_token");
