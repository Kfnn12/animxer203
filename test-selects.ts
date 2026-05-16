import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://anikototv.to/filter').then(r => {
    const $ = cheerio.load(r.data);
    $('select').each((i, el)=> console.log($(el).attr('name'), $(el).find('option').eq(1).val()));
})
