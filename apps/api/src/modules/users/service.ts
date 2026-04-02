import { prisma } from "src/db/prisma";
import Elysia from "elysia";

class UsersService {
  async list() {
    return prisma.user.findMany();
  }
}

export const usersService = new Elysia({
  name: "flaptalk.users.service",
}).decorate("usersService", new UsersService());
