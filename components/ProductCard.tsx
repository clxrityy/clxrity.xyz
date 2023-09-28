'use client';
import { Products } from '@/models/Product';
import styles from '@/styles/Shop.module.css';
import Image from "next/image";
import { useRouter } from "next/navigation";


interface Props {
    product: Products;
}

const ProductCard = ({ product }: Props) => {

    const router = useRouter();

    const url = process.env.NODE_ENV === 'development' ? `http://localhost:3000/shop/product/${product.id}` : `https://clxrity.xyz/shop/product/${product.id}`;

    const handleClick = () => {
        router.push(url);
    }


    return (
        <div className={styles.card} onClick={handleClick}>
            <div>

                <div className="items-center flex flex-row space-x-2">
                    <Image src={product.images[0]} width={50} height={50} className="rounded-xl" alt={product.name} priority />
                    <h1 className="font-bold">
                        {product.name}
                    </h1>
                </div>

            </div>
        </div>
    )
}

export default ProductCard;