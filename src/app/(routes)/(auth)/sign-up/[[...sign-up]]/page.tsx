import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg text-center space-y-8 items-center flex flex-col justify-center">
                <h3>
                    Access more with an account
                </h3>
                <div className="flex flex-col items-center gap-4 text-gray-300 justify-center">
                    <ul className="list-disc flex flex-col items-start">
                        <li>
                            Access discussion boards
                        </li>
                        <li>
                            Submit your own audio files
                        </li>
                        <li>
                            Leave comments and feedback
                        </li>
                        <li>
                            Connect with other creators
                        </li>
                    </ul>
                    <p className="underline underline-offset-4">
                        You do not need an account to access the audio library
                    </p>
                </div>
                <SignUp />
            </div>
        </div>
    )
}