-- CreateTable
CREATE TABLE "NewsLetter" (
    "newsletter_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsLetter_pkey" PRIMARY KEY ("newsletter_id")
);
