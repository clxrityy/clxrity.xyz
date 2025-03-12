export interface NetworkInterface {
    name: string;
    url: string;
    icon: string;
    colors?: {
        primary: string;
        secondary: string;
    };
    description?: string;
}

export const networks: NetworkInterface[] = [
    {
        name: "mc",
        url: "https://web.clxrity.xyz",
        icon: "/mc.png",
        description: "Minecraft Java server hosted at mc.clxrity.xyz"
    },
    {
        name: "wav",
        url: "https://wav.clxrity.xyz",
        icon: "/wav.png",
        description: "A dynamic audio library"
    },
    {
        name: "os",
        url: "https://os.clxrity.xyz",
        icon: "/os.png",
        description: "An OS/desktop environment for the web"
    }
];