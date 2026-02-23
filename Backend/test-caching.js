const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const API_BASE = "http://localhost:8080/api";

async function benchmark() {
    console.log("Starting Cache Benchmark...\n");

    try {
        // --- TEST STATS ---
        console.log("Testing /api/stats:");
        const start1 = Date.now();
        const res1 = await axios.get(`${API_BASE}/stats`);
        const duration1 = Date.now() - start1;
        console.log(`- Request 1 (Initial): ${duration1}ms`);

        const start2 = Date.now();
        const res2 = await axios.get(`${API_BASE}/stats`);
        const duration2 = Date.now() - start2;
        console.log(`- Request 2 (Cached):  ${duration2}ms`);
        console.log(`- Speed Improvement: ${((duration1 - duration2) / duration1 * 100).toFixed(1)}%\n`);

        // --- TEST FEATURED ---
        console.log("Testing /api/featured:");
        const start3 = Date.now();
        await axios.get(`${API_BASE}/featured`);
        const duration3 = Date.now() - start3;
        console.log(`- Request 1 (Initial): ${duration3}ms`);

        const start4 = Date.now();
        await axios.get(`${API_BASE}/featured`);
        const duration4 = Date.now() - start4;
        console.log(`- Request 2 (Cached):  ${duration4}ms`);
        console.log(`- Speed Improvement: ${((duration3 - duration4) / duration3 * 100).toFixed(1)}%\n`);

    } catch (err) {
        console.error("Benchmark failed. Is the server running?", err.message);
    }
}

benchmark();
