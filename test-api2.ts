import axios from 'axios';
setTimeout(async () => {
    try {
        const r1 = await axios.get('http://localhost:3000/api/search?types=2');
        console.log('type[]=2 results:', r1.data.results[0].title);
    } catch(e) { console.error('R1 failed') }
    try {
        const r2 = await axios.get('http://localhost:3000/api/search?types=1');
        console.log('type[]=1 results:', r2.data.results[0].title);
    } catch(e) { console.error('R2 failed') }
    try {
        const r3 = await axios.get('http://localhost:3000/api/search?keyword=hero&types=1');
        console.log('type[]=1 + hero results:', r3.data.results[0].title);
    } catch(e) { console.error('R3 failed') }
    process.exit(0);
}, 100);
