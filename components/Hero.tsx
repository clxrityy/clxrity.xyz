import styles from '@/styles/Hero.module.css';
import { PiPottedPlantFill } from 'react-icons/pi';
import { ImSpotify, ImSoundcloud } from 'react-icons/im';

const Hero = () => {
    return (
        <div className="flex justify-center items-center h-[50vh] md:h-[75vh] w-full md:w-[50%] flex-col space-y-7 md:space-y-10 container">

            <div className="flex flex-row items-center">
                <h1 className={`${styles.primaryTextGradient} heading p-2 font-bold`}>
                    cl<span className='underline underline-offset-8'>x</span>rity
                </h1>
                <h1 className={`${styles.secondaryIcon}`}>
                    <PiPottedPlantFill />
                </h1>
            </div>
            <div className='flex flex-row items-center justify-evenly space-x-8'>
                <ImSpotify className={`${styles.socialIcon}`} />
                <ImSoundcloud className={`${styles.socialIcon}`} />
            </div>
        </div>
    )
}

export default Hero;