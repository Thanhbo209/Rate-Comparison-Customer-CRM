-- DropIndex
DROP INDEX "ShipmentRate_shipmentId_providerId_key";

-- AlterTable
ALTER TABLE "ShipmentRate" ADD COLUMN     "optionName" TEXT;
