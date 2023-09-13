import mongoose from "mongoose";

let isConnected = false; // Variable to check if mongoose is connected


export const connectToDB = async () => {
    mongoose.set("strictQuery", true);

    if (!process.env.MONGODB_URL) {
        return console.log("MONGO_URL is missing from .env file");
    }
    if (isConnected) {
        console.log("=> using existing database connection");
    }
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        isConnected = true;
        console.log("=> using new database connection");
    } catch (error) {
        console.log("=> error connecting to database:", error);
    }
};
