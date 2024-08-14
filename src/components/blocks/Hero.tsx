import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import Waveform from '../svg/Waveform';
import { Button } from '../ui/button';
import WaveformAnimation from '../animations/WaveformAnimation';
import Link from 'next/link';

export default function Hero() {
    return (
        <Card className='hero'>
            <div>
                <CardHeader className='flex flex-col items-center gap-3'>
                    <CardTitle className='flex flex-row items-center gap-2'>
                        <h1 className="title">
                            cl<span className="underline underline-offset-8">x</span>rity
                        </h1>
                        <Waveform className='h-8 w-8' />
                    </CardTitle>
                    <CardDescription className='text-center text-sm sm:text-base max-w-2xl'>
                        A versatile and dynamic audio library for producers and creators. 100% free, open-source, community-driven, and royalty-free.
                    </CardDescription>
                </CardHeader>
                <CardContent className='w-full flex items-center justify-center'>
                    <WaveformAnimation />

                </CardContent>
                <CardFooter className='w-full flex flex-col gap-4 items-center justify-center'>
                    <p className='opacity-70 text-sm'>
                        Share the sounds you create
                    </p>
                    <div className='flex flex-row items-center justify-center gap-3'>
                        <Button variant={"default"} className='btn btn-primary'>
                            <Link href="/sign-up">
                                Join
                            </Link>
                        </Button>
                        <Button variant={"secondary"} className='btn btn-secondary'>
                            <Link href={'/sounds'}>
                                Browse
                            </Link>
                        </Button>
                    </div>
                </CardFooter>
            </div>
        </Card>
    )
}
