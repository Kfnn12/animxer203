import axios from 'axios';

async function test() {
    try {
        const url2 = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://anikototv.to/ajax/server/list?servers=113426');
        const res2 = await axios.get(url2, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        console.log("codetabs works:", res2.data);
    } catch(e) {
        console.log("codetabs failed:", e.message);
    }
}
test();
