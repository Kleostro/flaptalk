import Elysia from "elysia";
import { usersService } from "./service";
import { UsersModel } from "./model";

export const usersModule = new Elysia({
  name: "flaptalk.contacts",
  prefix: "/users",
})
  .use(usersService)
  .model(UsersModel)
  .get("/", async ({ usersService }) => usersService.list());
