ALTER TABLE "messages"
ADD COLUMN "parent_message_id" INTEGER;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_parent_message_id_fkey"
FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE INDEX "messages_parent_message_id_idx"
ON "messages"("parent_message_id");

CREATE INDEX "messages_room_id_parent_message_id_created_at_idx"
ON "messages"("room_id", "parent_message_id", "created_at");
