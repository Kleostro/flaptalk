-- CreateTable
CREATE TABLE "invites" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE INDEX "invites_workspace_id_created_at_idx" ON "invites"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "invites_token_used_at_idx" ON "invites"("token", "used_at");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
