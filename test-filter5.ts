import axios from 'axios';
import * as cheerio from 'cheerio';
axios.request({
    url: 'https://images.dog.ceo/breeds/pug/n02110958_13611.jpg',
}).then(r => console.log('works')).catch(e => {
    axios.get('https://thingproxy.freeboard.io/fetch/https://anikototv.to/filter?type[]=2').then(r => {
        const $ = cheerio.load(r.data);
        console.log('Type 2 (TV?):', !!$('.list-items .item').length);
    }).catch(e => console.error(e));
});
