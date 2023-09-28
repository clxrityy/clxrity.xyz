import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import mongoose from 'mongoose';


const uri = process.env.MONGO_URI!;
let credentials: Buffer | string;
if (process.env.NODE_ENV === 'production') {
    credentials = process.env.MONGO_CERT!;
} else {
    credentials = fs.readFileSync('./mongodb.pem');
}

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const clientPromise = client.connect();

export { clientPromise };

declare global {
    var mongoose: any;
}

if (!uri) {
    throw new Error('Missing MongoDB URI');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri).then((mongoose) => {
            return mongoose;
        })
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.conn;
}

export default dbConnect;