import { TRPCError, initTRPC } from "@trpc/server";
import dotenv from "dotenv";
dotenv.config();
/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<{ userName?: string; password?: string }>().create();
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(async (opts) => {
  const userName = opts.ctx.userName;
  const password = opts.ctx.password;
  if (!(userName && password)) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  } else return opts.next({ ctx: { userName, password } });
});