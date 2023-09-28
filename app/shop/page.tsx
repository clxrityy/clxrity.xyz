'use client';
import { signIn, useSession } from "next-auth/react";
import axios from 'axios';
import { useState, useEffect } from 'react';
import { PiMicrophoneStageFill, PiWaveformBold } from 'react-icons/pi';
import ProductCard from "@/components/ProductCard";
import { Products } from "@/models/Product";
import Loading from "@/components/Loading";

export default function ShopHome() {

    const { data: session, status } = useSession();

    const [products, setProducts] = useState<Products[]>([]);

    const fetchProducts = async () => {
        const { data } = await axios.get('/api/shop/getproducts');
        setProducts(data);
    }

    const manageProducts = async () => {
        if (products.length) {
            fetch('/api/database/products', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(products)
            })
        }
    }

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProducts().finally(() => manageProducts())
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, products]);



    if (status === 'loading') {
        return <Loading />
    }

    if (status === 'unauthenticated') {

        return <div className="w-full h-[100vh] flex items-center justify-center">
            <h1 className="text-5xl font-semibold">
                <span onClick={() => signIn('google')} className="text-[#1951b2] hover:underline">
                    Sign in
                </span>
                {' '} to access this page!
            </h1>
        </div>;
    }

    return (
        <div className="w-full h-full flex flex-col space-y-10 items-center">
            <div className="flex items-center justify-center h-[35vh] flex-col space-y-5">
                <h1 className="text-4xl font-black">
                    clxrity | shop
                </h1>
                <h2 className="flex flex-row space-x-2">
                    <PiMicrophoneStageFill />
                    <PiWaveformBold />
                </h2>
            </div>
            <div className="space-y-5">
                {
                    products && products.map((product) => (
                        <div key={product.id}>
                            <ProductCard product={product} />
                        </div>
                    ))
                }
            </div>
        </div>
    )
}