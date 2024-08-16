export default function UploadBox({ children }: { children: React.ReactNode }) {
    return (
        <label htmlFor="dropzone-file" className="flex flex-col items-center w-72 md:w-80 lg:w-96 xl:w-[28rem] h-40 md:h-52 xl:h-62 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/60 transition-colors my-4">
            <div className="flex flex-col items-center justify-center px-4 w-full mx-auto text-center h-full">
                <svg className="w-8 h-8 mb-4 text-zinc-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                </svg>
                <p className="mb-2 text-lg md:text-xl text-primary-500">Click to upload</p>
                <p className="text-xs text-gray-400/95"><span className='font-mono'>(MAX. 25MB)</span></p>
            </div>
            {children}
        </label>
    )
}