import mongoose from "mongoose";

export interface Products extends mongoose.Document {
    name: string;
    description: string;
    id: string;
    images: string[];
    metadata: {
        key: string;
        value: string;
    }
}

const ProductSchema = new mongoose.Schema<Products>({
    id: {
        type: String,
    },
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    images: {
        type: [String],
    },
    metadata: {
        type: Object
    }
    
});

export default mongoose.models.Product || mongoose.model<Products>('Product', ProductSchema)