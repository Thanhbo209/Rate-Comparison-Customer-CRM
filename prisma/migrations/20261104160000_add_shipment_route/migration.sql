-- Reconciliation migration:
-- Shipment.route already exists in the database.
-- This migration records the existing schema change.
ALTER TABLE "Shipment" ADD COLUMN "route" TEXT;