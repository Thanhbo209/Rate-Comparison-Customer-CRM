-- AlterTable
ALTER TABLE "FreightItem" DROP COLUMN "profit",
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'USD';

-- CreateTable
CREATE TABLE "OrganizationExchangeRate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationExchangeRate_organizationId_idx" ON "OrganizationExchangeRate"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationExchangeRate_organizationId_fromCurrency_toCurr_key" ON "OrganizationExchangeRate"("organizationId", "fromCurrency", "toCurrency");

-- AddForeignKey
ALTER TABLE "OrganizationExchangeRate" ADD CONSTRAINT "OrganizationExchangeRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
