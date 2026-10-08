-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "selectedRateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_selectedRateId_key" ON "Shipment"("selectedRateId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_selectedRateId_fkey" FOREIGN KEY ("selectedRateId") REFERENCES "ShipmentRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
