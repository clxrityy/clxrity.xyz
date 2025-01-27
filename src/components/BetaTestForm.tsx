import { Lock } from "lucide-react";



export function BetaTestForm({
    isAlreadySubmitted,
}: {
    isAlreadySubmitted: boolean;
}) {



    return (
        <div className="w-3/5 h-fit flex flex-col items-end justify-center gap-6 beta-form">
            <div className="flex flex-col items-start justify-center gap-4 w-full">
                <h2 className="uppercase tracking-wide">
                    Become a beta tester
                </h2>
                <ul className="text-sm lg:text-base xl:text-lg font-semibold tracking-wider text-zinc-300/90 max-w-[100%] lg:max-w-[90%] xl:max-w-[80%] 2xl:max-w-[70%] list-disc space-y-2 list-outside ml-4 lg:ml-6 xl:ml-8 2xl:ml-10">
                    <li>
                        <p>
                            Access new features and updates before the general public
                        </p>
                    </li>
                    <li>
                        <p>
                            Private Discord server to provide feedback and report bugs
                        </p>
                    </li>
                    <li>
                        <p>
                           Exclusive in-game items and cosmetics
                        </p>
                    </li>
                </ul>
                <div className="flex flex-col items-start justify-center gap-2 w-full">
                    <p className="text-sm lg:text-base xl:text-lg font-semibold tracking-wider text-red-300/90 flex flex-row items-center justify-center gap-2">
                        <Lock size={16} /> Beta testing form will be available soon
                    </p>
                </div>
            </div>
            <form className="flex flex-col items-center justify-center gap-4 w-full lg:w-3/4 xl:w-2/3 h-fit py-7 px-8 mx-5 my-2 border rounded-[5px] border-zinc-700">
                <div className="flex flex-col items-start justify-center gap-4 w-full">
                    <label htmlFor="email" className="text-sm lg:text-base xl:text-lg font-semibold tracking-wider font-mono text-zinc-300/90 uppercase">
                        Email
                    </label>
                    <input type="email" name="email" id="email" className="" required placeholder="contact@mjanglin.com" />
                </div>
                <div className="flex flex-col items-start justify-center gap-4 w-full">
                    <label htmlFor="name" className="text-sm lg:text-base xl:text-lg font-semibold tracking-wider font-mono text-zinc-300/90 uppercase">
                        Username
                    </label>
                    <input type="text" name="name" id="name" className="" required placeholder="clxrity" />
                </div>
                <div className="flex flex-col items-start justify-center gap-4 w-full">
                    <label htmlFor="Additional" className="text-sm lg:text-base xl:text-lg font-semibold tracking-wider font-mono text-zinc-300/90 uppercase">
                        Additional information
                    </label>
                    <textarea name="Additional" id="Additional" className="" required={false} placeholder="Provide any external links or information (optional)" />
                </div>
                <button disabled={isAlreadySubmitted} type="submit" className="font-bold bg-zinc-400 text-black px-5 py-3 mt-4 rounded-xl uppercase tracking-wider text-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-90 focus:ring-offset-1 focus:ring-offset-white/50">
                    Submit
                </button>
            </form>
        </div>
    )
}