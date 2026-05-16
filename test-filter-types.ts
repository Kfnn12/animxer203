import axios from 'axios';
import * as cheerio from 'cheerio';
async function test() {
   const res1 = await axios.get('https://thingproxy.freeboard.io/fetch/https://anikototv.to/filter?type[]=2').catch(e => { console.log('Proxy 1 failed'); return null; });
   if (res1) {
      console.log('type[]=2 ->', cheerio.load(res1.data)('.list-items .item').length);
   }
   
   const res2 = await axios.get('https://thingproxy.freeboard.io/fetch/https://anikototv.to/filter?type=2').catch(e => null);
   if (res2) {
      console.log('type=2 ->', cheerio.load(res2.data)('.list-items .item').length);
   }

   const res3 = await axios.get('https://thingproxy.freeboard.io/fetch/https://anikototv.to/filter?term_type[]=TV').catch(e => null);
   if (res3) {
      console.log('term_type[]=TV ->', cheerio.load(res3.data)('.list-items .item').length);
   }
}
test();
