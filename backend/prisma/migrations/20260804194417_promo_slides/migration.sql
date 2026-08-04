-- CreateTable
CREATE TABLE "PromoSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "href" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoSlide_active_sortOrder_idx" ON "PromoSlide"("active", "sortOrder");
