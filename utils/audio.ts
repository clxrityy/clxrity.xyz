import { Products } from "@/models/Product";

export const audio = (product: Products): string => {

    let file: string = '';

    if (product.metadata.value === 'spaceship') {
        file = '/audio/spaceship.wav';
    } else {
        file = '/audio/spaceship.wav'
    }

    return file;
}