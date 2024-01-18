import { router, publicProcedure, privateProcedure } from "./trpc";
import { User, Todo } from "./schema";
import { z } from "zod";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { TRPCError } from "@trpc/server";
dotenv.config();
const userSecret = process.env.USER_SECRET as string;
const mongoUrl = process.env.MONGO_URL as string;
(async function () {
  await mongoose.connect(mongoUrl);
})();

const createTodoInput = z.object({
  title: z.string(),
  description: z.string(),
});

const getTodoInput = z.object({
  title: z.string(),
});

const appRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        userName: z.string(),
        password: z.string(),
      })
    )
    .mutation(async (opts) => {
      const dbUserName = await User.findOne({ userName: opts.input.userName });
      if (dbUserName) {
        console.log("Conflict error");
        throw new TRPCError({
          message: "username already used",
          code: "CONFLICT",
        });
      } else {
        console.log("IN ELSE");
        const newUser = new User({
          userName: opts.input.userName,
          password: opts.input.password,
        });
        console.log("User created");
        await newUser.save();
        console.log("User saved");

        const token = jwt.sign(
          {
            userName: opts.input.userName,
            password: opts.input.password,
          },
          userSecret
        );
        console.log("Token = " + token);

        return { token };
      }
    }),
  signin: publicProcedure
    .use((opts) => {
      console.log("Hello world from Middleware");
      return opts.next({ ctx: opts.ctx });
    })
    .input(z.object({ userName: z.string(), password: z.string() }))
    .query(async (opts) => {
      const dbUser = await User.findOne({
        userName: opts.input.userName,
        password: opts.input.password,
      });
      if (!dbUser) {
        throw new TRPCError({
          message: "Wrong username or password",
          code: "NOT_FOUND",
        });
      } else {
        const token = jwt.sign(
          {
            userName: opts.input.userName,
            password: opts.input.password,
          },
          userSecret
        );
        return { token };
      }
    }),
  createTodo: privateProcedure
    .input(z.object({ title: z.string(), description: z.string() }))
    .mutation(async (opts) => {
      try {
        const userName = opts.ctx.userName;
        const title = opts.input.title;
        const description = opts.input.description;
        const newTodo = new Todo({ title, description });
        await newTodo.save();
        const dbUser = await User.findOne({ userName });
        dbUser?.todos.push(newTodo._id);
        dbUser?.save();

        return { message: "Todo created" };
      } catch (e) {
        throw new TRPCError({
          message: "Error in database",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
  getAllTodos: privateProcedure.query(async (opts) => {
    const userName = opts.ctx.userName;
    const dbUser = await User.findOne({ userName }).populate("todos");
    return dbUser;
  }),
});

const server = createHTTPServer({
  router: appRouter,
  async createContext(opts) {
    const token = opts.req.headers.authorization?.split(" ")[1];
    if (token && process.env.USER_SECRET) {
      try {
        const user = jwt.verify(token, process.env.USER_SECRET) as {
          userName: string;
          password: string;
        };
        const dbUser = await User.findOne({
          userName: user.userName,
          password: user.password,
        });
        if (dbUser) return { userName: user.userName, password: user.password };
      } catch (e) {
        return {};
      }
    }
    return {};
  },
});
server.listen(3000);
export type AppRouter = typeof appRouter;