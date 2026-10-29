import { config } from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV || "development";

const envPath = {
    development: ".env.development",
    production: ".env.production"
};

// تحميل الـ env في البداية خالص
config({ path: resolve(`config/${envPath[NODE_ENV]}`) });

export const PORT = +process.env.PORT;
export const DB_URI = process.env.DB_URI; 
export const ALLOW_ORIGINS = process.env.ALLOW_ORIGINS.split(",");
export const REDIS_URL = process.env.REDIS_URL;