import dbConnect from "@/lib/db";
import Product, { Products } from "@/models/Product";
import { NextApiResponse } from "next";
import { NextResponse } from "next/server";


export async function POST(req: any, res: NextApiResponse) {
    
    const data: Array<Products> = await req.json();

    try {
        await dbConnect();
        let result: Array<Products> = []
        if (data.length) {
            data.forEach(async (product) => {
                let doc: Products | null = await Product.findOne({
                    name: product.name
                });
                if (doc) {
                    result.push(doc);
                } else {
                    doc = await Product.create(product);
                    result.push(doc!);
                }
                return result
            });
        } else {
            return NextResponse.json({ message: result, success: false });
        }
        return NextResponse.json({ message: result, success: true });

    } catch (err) {
        return NextResponse.json({ error: err, success: false });
    }
}