-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rooms_workspace_id_idx" ON "rooms"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_workspace_id_slug_key" ON "rooms"("workspace_id", "slug");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
