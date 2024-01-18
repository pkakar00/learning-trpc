import mongoose from "mongoose";

interface IUser{
    userName:string,
    password:string,
    todos:mongoose.Types.ObjectId[]
}
interface ITodo{
    title:string,
    description:string,
}