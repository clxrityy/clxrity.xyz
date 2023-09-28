import dbConnect from "@/lib/db";
import Product, { Products } from "@/models/Product";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const url = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api/database/products/' : 'https://clxrity.xyz/api/database/products/';
    const id = req.url.replace(url, '');
    try {
        await dbConnect();
        const doc: Products | null = await Product.findOne({
            id: id
        });
        if (doc !== null) {
            return NextResponse.json({ message: doc, success: true });
        } else {
            return NextResponse.json({ error: "Document doesn't exist!", success: false });
        }

    } catch  (err) {
        return NextResponse.json({ error: err, success: false });
    }
}