export interface DesktopApp {
    name: string;
    icon: string; // URL or path to the icon image
    link: string; // URL to open when the icon is clicked
    description?: string; // Optional description for tooltip or accessibility
    online?: boolean; // Optional status indicator
}

// Configuration for desktop apps/links
// Add or remove items to change what appears on the desktop
export const desktopApps: DesktopApp[] = [
    {
        name: "wav",
        icon: "https://wav.clxrity.xyz/android-chrome-192x192.png",
        link: "https://wav.clxrity.xyz",
        online: true,
        description: "An audio sharing platform"
    },
    {
        name: "os",
        icon: "https://os.clxrity.xyz/android-chrome-192x192.png",
        link: "https://os.clxrity.xyz",
        online: true,
        description: "My custom operating system"
    },
    {
        name: "hbd",
        icon: "https://hbd.clxrity.xyz/android-chrome-192x192.png",
        link: "https://hbd.clxrity.xyz",
        online: true,
        description: "A Discord bot for managing birthdays"
    },
    {
        name: "mc",
        icon: "https://clxrity.xyz/android-chrome-192x192.png",
        link: "https://mc.clxrity.xyz",
        online: false,
        description: "My Minecraft server"
    }
    // Add more apps as needed
];