/*
  Warnings:

  - You are about to drop the column `imagen_url` on the `productos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "productos" DROP COLUMN "imagen_url",
ADD COLUMN     "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
