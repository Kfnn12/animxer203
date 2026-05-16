import express from 'express';
// We just want to fetch using the local API
import axios from 'axios';
setTimeout(async () => {
    try {
        const r1 = await axios.get('http://localhost:3000/api/search?types=2');
        console.log('type[]=2 results:', r1.data.results.length);
    } catch(e) { console.error('R1 failed') }
    try {
        const r2 = await axios.get('http://localhost:3000/api/search?types=TV');
        console.log('type[]=TV results:', r2.data.results.length);
    } catch(e) { console.error('R2 failed') }
    process.exit(0);
}, 2000); // give time for server? No, server is running in background maybe.
