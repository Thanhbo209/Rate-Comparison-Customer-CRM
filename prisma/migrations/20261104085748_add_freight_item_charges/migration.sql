-- AlterTable
ALTER TABLE "FreightItem" ADD COLUMN     "exportCharge" TEXT,
ADD COLUMN     "fare" DECIMAL(65,30),
ADD COLUMN     "importCharge" TEXT;
