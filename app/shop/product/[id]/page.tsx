'use client';

import AudioBtn from "@/components/AudioBtn";
import Loading from "@/components/Loading";
import config from "@/config";
import { Products } from "@/models/Product";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";


export default function ProductPage({ params }: { params: { id: string } }) {

    const { data: session, status } = useSession();

    const [product, setProduct] = useState<Products>();


    useEffect(() => {

        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(`/api/database/products/${params.id}`);
                if (data) {
                    setProduct(data.message);
                } else {
                    console.log("ERROR");
                }
            } catch (err) {
                console.log(err);
            }
        }

        if (status === 'authenticated') fetchProduct();
    }, [status, params.id, product]);

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

    return product ? (
        <div className="w-full h-full container items-center">
            <div className="flex flex-row items-center justify-evenly h-full">

                <div className="flex flex-col items-center justify-center h-[90vh] space-y-10">
                    <h1 className={`text-2xl md:text-3xl hover:text-[${config.colors.complimentary}] hover:underline transition-all cursor-pointer font-bold`}>
                        {product.name}
                    </h1>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-x-4">
                        <Image src={product.images[0]} alt={product.name} className="rounded-xl drop-shadow-xl cursor-pointer hover:rounded-2xl hover:shadow-2xl hover:scale-90 transition-all border-white hover:border-2" width={150} height={150} priority />
                        <AudioBtn product={product} />
                    </div>

                    <p className="max-w-[300px] text-center">
                        {product.description}
                    </p>
                </div>

            </div>
        </div>
    ) : <Loading />
}