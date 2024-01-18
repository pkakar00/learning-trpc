import mongoose from "mongoose";
import { ITodo, IUser } from "../types";

const userSchema = new mongoose.Schema<IUser>({
    userName: String,
    password: String,
    todos:[{type:mongoose.Types.ObjectId, ref:"Todo"}]
})
const todoSchema = new mongoose.Schema<ITodo>({
    title: String,
    description: String
})
export const User = mongoose.model('User',userSchema);
export const Todo = mongoose.model('Todo',todoSchema);