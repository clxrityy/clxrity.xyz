"use server";
import clerkClient from "@/lib/clerk";


export default async function getUser(id: string) {
    return await clerkClient.users.getUser(id);
}