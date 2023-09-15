import { authOptions } from "@/lib/auth";
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (session) {
        return new Response(JSON.stringify(session), { status: 200 });
    } else {
        return new Response("Not authenticated!", { status: 401 });
    }
}