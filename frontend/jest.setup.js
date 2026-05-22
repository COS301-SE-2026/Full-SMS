import "@testing-library/jest-dom";
import dotenv from "dotenv";
import path from "path";
import "whatwg-fetch";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
