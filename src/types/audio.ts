// GENRES
export enum Genres {
    INDIE = "indie",
    ROCK = "rock",
    POP = "pop",
    ALTERNATIVE = "alternative",
    FOLK = "folk",
    ELECTRONIC = "electronic",
    AMBIENT = "ambient",
    OTHER = "other",
}

// MOODS
export enum Moods {
    HAPPY = "happy",
    SAD = "sad",
    ENERGETIC = "energetic",
    CHILL = "chill",
    ANGRY = "angry",
    RELAXED = "relaxed",
    NOSTALGIC = "nostalgic",
    ROMANTIC = "romantic",
    HYPER = "hyper",
}

// KEYS
export enum Keys {
    C = "C",
    CSharp = "C#",
    D = "D",
    DSharp = "D#",
    E = "E",
    F = "F",
    FSharp = "F#",
    G = "G",
    GSharp = "G#",
    A = "A",
    ASharp = "A#",
    B = "B",
    CMinor = "Cm",
    CSharpMinor = "C#m",
    DMinor = "Dm",
    DSharpMinor = "D#m",
    EMinor = "Em",
    FMinor = "Fm",
    FSharpMinor = "F#m",
    GMinor = "Gm",
    GSharpMinor = "G#m",
    AMinor = "Am",
    ASharpMinor = "A#m",
    UNKNOWN = "unknown",
}

// BPM
export const MaxBPM = 200 as const;
export const MinBPM = 60 as const;

export function isValidBPM(bpm: number): boolean {
    return bpm >= MinBPM && bpm <= MaxBPM;
}

// INSTRUMENTS
export enum Instruments {
    GUITAR = "guitar",
    BASS = "bass",
    DRUMS = "drums",
    PIANO = "piano",
    SYNTH = "synth",
    STRINGS = "strings",
    OTHER = "other",
}