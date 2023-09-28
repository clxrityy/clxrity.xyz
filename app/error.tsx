'use client';

import { useEffect, useState } from "react";
import { MdError } from 'react-icons/md';

export default function Error({
    error,
    reset
}: {
    error: Error,
    reset: () => void
}) {
    const [currentError, setCurrentError] = useState<Error>();

    useEffect(() => {

        setCurrentError(error);

    }, [error])

    return (
        <div className="container">
            <div className="w-full h-full flex items-center justify-center flex-col space-y-10">
                <h1 className="flex flex-row">
                    Error! <MdError className="animate-pulse" />
                </h1>
                <p>
                    {currentError?.message}
                </p>
            </div>
        </div>
    );

}