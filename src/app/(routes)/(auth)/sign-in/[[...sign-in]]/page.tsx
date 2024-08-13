import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg text-center space-y-8 items-center flex flex-col justify-center">
                <h3>
                    Sign in
                </h3>
                <SignIn />
            </div>
        </div>
    )
}