// This file can only be used on server side
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

// Ensure code runs only on server side
if (typeof window !== 'undefined') {
    throw new Error(
        'lib/mongodb should only be used within API routes or server-side code.\n' +
        'For client-side code, use API routes instead.'
    );
}

const uri = process.env.MONGODB_URI;
// Simplify connection options, use latest recommended configuration
const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // Use global variable in dev mode so hot reload doesn't create new connections
    const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // Create new connection in production environment
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise; 