-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_destinationAccountId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_sourceAccountId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "sourceAccountId" DROP NOT NULL,
ALTER COLUMN "destinationAccountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
