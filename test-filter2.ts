import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://anikototv.to/filter').then(r => {
    const $ = cheerio.load(r.data);
    $('.filter-block').each((i, block) => {
        console.log('Block', i, 'Title:', $(block).find('.title').text().trim(), $(block).find('.mb-3, .mt-3, h3, h4, span').first().text().trim());
    });
});
