interface Config {
    colors: {
        background: string;
        white: string;
        primary: string;
        secondary: string;
        complimentary: string;
    },
    audio: {
        songs: Song[]
    }
}

interface Song {
    name: string;
    file: string;
}

const config: Config = {
    colors: {
        background: '#0e0e0e',
        white: '#dddddd',
        primary: '#a26baa',
        secondary: '#8c44d0',
        complimentary: '#1951b2',
    },
    audio: {
        songs: [
            {
                name: 'spaceship',
                file: '/audio/spaceship.wav'
            }
        ]
    }
}

export default config;