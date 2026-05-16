import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    try {
        const url = 'http://localhost:3000/api/lists?type=filter&types=TV';
        const res = await axios.get(url);
        console.log("Found", res.data.results.length, "anime");
        if (res.data.results.length > 0) {
            console.log("First type:", res.data.results[0].type);
        }
    } catch(e) {
        console.error("Failed API:", e.message);
    }
}
test();
