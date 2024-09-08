import AdminPanel from "@/components/structure/AdminPanel";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: Readonly<{children: React.ReactNode}>) {

    const { sessionClaims } = auth();

    if (!sessionClaims) {
        return redirect("/sign-in");
    }

    if (sessionClaims.metadata.role !== "admin") {
        return redirect("/")
    }

    return (
        <div className="relative h-screen w-screen">
            {children}
            <AdminPanel />
        </div>
    )
}