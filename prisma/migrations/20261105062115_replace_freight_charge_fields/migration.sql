/*
  Warnings:

  - You are about to drop the column `exportCharge` on the `FreightItem` table. All the data in the column will be lost.
  - You are about to drop the column `fare` on the `FreightItem` table. All the data in the column will be lost.
  - You are about to drop the column `importCharge` on the `FreightItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FreightChargeType" AS ENUM ('STANDARD', 'EXPORT_CHARGE', 'IMPORT_CHARGE', 'FARE');

-- AlterTable
ALTER TABLE "FreightItem" DROP COLUMN "exportCharge",
DROP COLUMN "fare",
DROP COLUMN "importCharge",
ADD COLUMN     "chargeType" "FreightChargeType" NOT NULL DEFAULT 'STANDARD';
