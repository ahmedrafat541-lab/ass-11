import { createClient } from "redis";
import { REDIS_URL } from "../../config/config.service.js"; // استيراد الرابط من الـ config مباشرة

export const redis_client = createClient({
    url: REDIS_URL
});

export default async function connectionRedis() {
    try {
        await redis_client.connect();
        console.log("Redis connected successfully");
    } catch (error) {
        console.error("Error connecting to Redis:", error);
    }
}