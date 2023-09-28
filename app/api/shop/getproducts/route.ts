import Stripe from 'stripe';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' });
    const products = await stripe.products.list({
        limit: 6
    });

    return NextResponse.json(products.data.reverse());
}