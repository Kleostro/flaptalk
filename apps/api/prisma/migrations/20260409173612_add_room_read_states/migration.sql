-- CreateTable
CREATE TABLE "room_read_states" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_read_message_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_read_states_user_id_idx" ON "room_read_states"("user_id");

-- CreateIndex
CREATE INDEX "room_read_states_last_read_message_id_idx" ON "room_read_states"("last_read_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_read_states_room_id_user_id_key" ON "room_read_states"("room_id", "user_id");

-- AddForeignKey
ALTER TABLE "room_read_states" ADD CONSTRAINT "room_read_states_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_read_states" ADD CONSTRAINT "room_read_states_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_read_states" ADD CONSTRAINT "room_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
