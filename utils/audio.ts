import config from "@/config";
import { Products } from "@/models/Product";

export const audio = (product: Products): string => {
    let file: string = '';
    if (product) {
        if (product.name.startsWith('spaceship')) {
            config.audio.songs.forEach((song) => {
                if (song.name === "spaceship")
                    file = song.file
            })
        }
    }

    return file;
}