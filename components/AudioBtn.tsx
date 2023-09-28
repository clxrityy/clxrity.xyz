'use client';
import { Products } from "@/models/Product";
import { audio } from "@/utils/audio";
import { useEffect, useState } from "react";
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';

type Props = {
  product: Products;
}

const AudioBtn = ({ product }: Props) => {

  const [audioDom, setAudioDom] = useState<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [playPause, setPlayPause] = useState(false);

  useEffect(() => {
    setAudioSrc(audio(product));

    if (audioDom && playPause === true) {
      audioDom.play();
    }
    if (audioDom && playPause === false) {
      audioDom.pause();
    }

  }, [product, audioDom, playPause]);


  const handleClick = () => {
    setPlayPause(!playPause);
  }

  return (
    <div
      onClick={handleClick}
      className={`hover:scale-125 transition-all rounded-full p-2 cursor-pointer text-8xl`}
    >
      {
        playPause === false ? (
          <BsPlayFill />
        ) : (
            <BsPauseFill />
        )
      }
      <audio ref={(element) => setAudioDom(element)} src={audioSrc} />
    </div>
  );
}

export default AudioBtn