import { TRPCClientError, createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server";
import { TRPCError } from "@trpc/server";
//     👆 **type-only** import
// Pass AppRouter as generic here. 👇 This lets the `trpc` object know
// what procedures are available on the server and their input/output types.
let jwtToken: string;
const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000",
      headers() {
        return {
          authorization: "Bearer " + jwtToken,
        };
      },
    }),
  ],
});

(async function () {
  try {
    const signupToken = await trpc.signup.mutate({
      userName: "pulkit",
      password: "123",
    });
    console.log("signupToken = " + signupToken.token);
  } catch (e:any){
    console.log("eee");
    console.log(e.shape);
  }

  const { token } = await trpc.signin.query({
    userName: "pulkit",
    password: "123",
  });
  console.log("signinToken = " + token);

  jwtToken = token;
  const createTodo = await trpc.createTodo.mutate({
    title: "This is the title2 of todo",
    description: "This is the description2 of todo",
  });

  console.log("Message = " + createTodo.message);

  const getAllTodos = await trpc.getAllTodos.query();
  console.log("getAllTodos = ");
  console.log(getAllTodos);
})();
