import { IconType } from "react-icons/lib";
import { Genres, Instruments, Keys, Moods } from "./audio";
import { GiLightningFrequency, GiKite, GiGuitar, GiMusicalNotes, GiMeditation, GiEnergise, GiHypersonicMelon, GiGuitarBassHead, GiViolin } from "react-icons/gi";
import { IoIosCloudy } from "react-icons/io";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { PiGuitarFill, PiSmileyAngry, PiSmileySadFill, PiPianoKeysFill } from "react-icons/pi";
import { TiWeatherSunny } from "react-icons/ti";
import { IoHappy } from "react-icons/io5";
import { TbRainbow } from "react-icons/tb";
import { FaBed, FaHeart, FaGuitar, FaDrum, FaKey } from "react-icons/fa";
import { LiaWaveSquareSolid } from "react-icons/lia";
import { BiMusic } from "react-icons/bi";

export interface AudioCategoryIcon {
    icon: IconType;
    title: string;
    color: string;
}

export const GenreAudioIcons: Record<keyof typeof Genres, AudioCategoryIcon> = {
    ALTERNATIVE: {
        title: "Alternative",
        icon: GiLightningFrequency,
        color: "#FFD700",
    },
    AMBIENT: {
        title: "Ambient",
        icon: IoIosCloudy,
        color: "#FFD700",
    },
    ELECTRONIC: {
        title: "Electronic",
        icon: BsFillLightningChargeFill,
        color: "#FFD700",
    },
    FOLK: {
        title: "Folk",
        icon: PiGuitarFill,
        color: "#FFD700",
    },
    POP: {
        title: "Pop",
        icon: TiWeatherSunny,
        color: "#FFD700",
    },
    ROCK: {
        title: "Rock",
        icon: GiGuitar,
        color: "#FFD700",
    },
    INDIE: {
        title: "Indie",
        icon: GiKite,
        color: "#FFD700",
    },
    OTHER: {
        title: "Other",
        icon: GiMusicalNotes,
        color: "#FFD700",
    },
};

export const MoodAudioIcons: Record<keyof typeof Moods, AudioCategoryIcon> = {
    ANGRY: {
        title: "Angry",
        icon: PiSmileyAngry,
        color: "#9042f5",
    },
    CHILL: {
        title: "Chill",
        icon: GiMeditation,
        color: "#9042f5",
    },
    ENERGETIC: {
        title: "Energetic",
        icon: GiEnergise,
        color: "#9042f5",
    },
    HAPPY: {
        title: "Happy",
        icon: IoHappy,
        color: "#9042f5",
    },
    HYPER: {
        title: "Hyper",
        icon: GiHypersonicMelon,
        color: "#9042f5",
    },
    NOSTALGIC: {
        title: "Nostalgic",
        icon: TbRainbow,
        color: "#9042f5",
    },
    RELAXED: {
        title: "Relaxed",
        icon: FaBed,
        color: "#9042f5",
    },
    ROMANTIC: {
        title: "Romantic",
        icon: FaHeart,
        color: "#9042f5",
    },
    SAD: {
        title: "Sad",
        icon: PiSmileySadFill,
        color: "#9042f5",
    },
};

export const InstrumentAudioIcons: Record<keyof typeof Instruments, AudioCategoryIcon> = {
    GUITAR: {
        title: "Guitar",
        icon: FaGuitar,
        color: "#f54242",
    },
    BASS: {
        title: "Bass",
        icon: GiGuitarBassHead,
        color: "#f54242",
    },
    DRUMS: {
        title: "Drums",
        icon: FaDrum,
        color: "#f54242",
    },
    PIANO: {
        title: "Piano",
        icon: PiPianoKeysFill,
        color: "#f54242",
    },
    SYNTH: {
        title: "Synth",
        icon: LiaWaveSquareSolid,
        color: "#f54242",
    },
    STRINGS: {
        title: "Strings",
        icon: GiViolin,
        color: "#f54242",
    },
    OTHER: {
        title: "Other",
        icon: BiMusic,
        color: "#f54242",
    },
}

export const KeyAudioIcons: Record<keyof typeof Keys, AudioCategoryIcon> = {
    C: {
        title: "C",
        icon: FaKey,
        color: "#65ad9e",
    },
    CSharp: {
        title: "C#",
        icon: FaKey,
        color: "#65ad9e",
    },
    D: {
        title: "D",
        icon: FaKey,
        color: "#65ad9e",
    },
    DSharp: {
        title: "D#",
        icon: FaKey,
        color: "#65ad9e",
    },
    E: {
        title: "E",
        icon: FaKey,
        color: "#65ad9e",
    },
    F: {
        title: "F",
        icon: FaKey,
        color: "#65ad9e",
    },
    FSharp: {
        title: "F#",
        icon: FaKey,
        color: "#65ad9e",
    },
    G: {
        title: "G",
        icon: FaKey,
        color: "#65ad9e",
    },
    GSharp: {
        title: "G#",
        icon: FaKey,
        color: "#65ad9e",
    },  
    A: {
        title: "A",
        icon: FaKey,
        color: "#65ad9e",
    },
    ASharp: {
        title: "A#",
        icon: FaKey,
        color: "#65ad9e",
    },
    B: {
        title: "B",
        icon: FaKey,
        color: "#65ad9e",
    },
    CMinor: {
        title: "Cm",
        icon: FaKey,
        color: "#65ad9e",
    },
    CSharpMinor: {
        title: "C#m",
        icon: FaKey,
        color: "#65ad9e",
    },
    DMinor: {
        title: "Dm",
        icon: FaKey,
        color: "#65ad9e",
    },
    DSharpMinor: {
        title: "D#m",
        icon: FaKey,
        color: "#65ad9e",
    },
    EMinor: {
        title: "Em",
        icon: FaKey,
        color: "#65ad9e",
    },
    FMinor: {
        title: "Fm",
        icon: FaKey,
        color: "#65ad9e",
    },
    FSharpMinor: {
        title: "F#m",
        icon: FaKey,
        color: "#65ad9e",
    },
    GMinor: {
        title: "Gm",
        icon: FaKey,
        color: "#65ad9e",
    },
    GSharpMinor: {
        title: "G#m",
        icon: FaKey,
        color: "#65ad9e",
    },
    AMinor: {
        title: "Am",
        icon: FaKey,
        color: "#65ad9e",
    },
    ASharpMinor: {
        title: "A#m",
        icon: FaKey,
        color: "#65ad9e",
    },
    UNKNOWN: {
        title: "Unknown",
        icon: FaKey,
        color: "#65ad9e",
    },
}