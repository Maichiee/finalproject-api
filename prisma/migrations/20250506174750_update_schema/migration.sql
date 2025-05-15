/*
  Warnings:

  - The primary key for the `addresses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `applications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `jobs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscriptioncategories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - Added the required column `addressId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_jobId_fkey";

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_addressId_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_addressId_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_subscriptionCategoryId_fkey";

-- AlterTable
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_pkey",
ALTER COLUMN "address_id" DROP DEFAULT,
ALTER COLUMN "address_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("address_id");
DROP SEQUENCE "addresses_address_id_seq";

-- AlterTable
ALTER TABLE "applications" DROP CONSTRAINT "applications_pkey",
ALTER COLUMN "application_id" DROP DEFAULT,
ALTER COLUMN "application_id" SET DATA TYPE TEXT,
ALTER COLUMN "jobId" SET DATA TYPE TEXT,
ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("application_id");
DROP SEQUENCE "applications_application_id_seq";

-- AlterTable
ALTER TABLE "companies" DROP CONSTRAINT "companies_pkey",
ALTER COLUMN "company_id" DROP DEFAULT,
ALTER COLUMN "company_id" SET DATA TYPE TEXT,
ALTER COLUMN "addressId" SET DATA TYPE TEXT,
ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id");
DROP SEQUENCE "companies_company_id_seq";

-- AlterTable
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_pkey",
ALTER COLUMN "job_id" DROP DEFAULT,
ALTER COLUMN "job_id" SET DATA TYPE TEXT,
ALTER COLUMN "companyId" SET DATA TYPE TEXT,
ALTER COLUMN "addressId" SET DATA TYPE TEXT,
ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id");
DROP SEQUENCE "jobs_job_id_seq";

-- AlterTable
ALTER TABLE "subscriptioncategories" DROP CONSTRAINT "subscriptioncategories_pkey",
ALTER COLUMN "subscriptioncategory_id" DROP DEFAULT,
ALTER COLUMN "subscriptioncategory_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "subscriptioncategories_pkey" PRIMARY KEY ("subscriptioncategory_id");
DROP SEQUENCE "subscriptioncategories_subscriptioncategory_id_seq";

-- AlterTable
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_pkey",
ALTER COLUMN "subscription_id" DROP DEFAULT,
ALTER COLUMN "subscription_id" SET DATA TYPE TEXT,
ALTER COLUMN "subscriptionCategoryId" SET DATA TYPE TEXT,
ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id");
DROP SEQUENCE "subscriptions_subscription_id_seq";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
ADD COLUMN     "addressId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("address_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("address_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("address_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriptionCategoryId_fkey" FOREIGN KEY ("subscriptionCategoryId") REFERENCES "subscriptioncategories"("subscriptioncategory_id") ON DELETE RESTRICT ON UPDATE CASCADE;
