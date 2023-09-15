export interface User {
    username: string;
    id: string;
    avatar: string;
    email: string;
}

export interface Product {
    name: string;
    media: string;
    description: string;
    id: string;
}

export interface Purchase {
    user: User;
    product: Product;
    id: string;
}
