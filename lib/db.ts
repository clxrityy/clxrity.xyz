import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';

const uri = process.env.MONGO_URI!;
let credentials: Buffer | string;
if (process.env.NODE_ENV === 'production') {
    credentials = process.env.MONGO_CERT!
} else {
    credentials = fs.readFileSync('./mongodb.pem');
}

// const certificate = process.env.MONGO_CERT!.replace(/\\n/g, '\n');
// const key = process.env.MONGO_KEY!.replace(/\\n/g, '\n')


declare global {
    var _mongoClientPromise: Promise<MongoClient>;
}

class Database {
    private static _instance: Database;
    private client: MongoClient;
    private clientPromise: Promise<MongoClient>;
    private constructor() {
        this.client = new MongoClient(uri, { key: credentials, cert: credentials, serverApi: ServerApiVersion.v1 });
        this.clientPromise = this.client.connect();
        if (process.env.NODE_ENV === 'development') {
            global._mongoClientPromise = this.clientPromise;
        }
    }

    public static get instance() {
        if (!this._instance) {
            this._instance = new Database();
        }
        return this._instance.clientPromise;
    }
}

const clientPromise = Database.instance;

export default clientPromise;