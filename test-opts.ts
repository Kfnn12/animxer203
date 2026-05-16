import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://api.codetabs.com/v1/proxy?quest=https://anikototv.to/filter').then(r => {
    const $ = cheerio.load(r.data);
    const selects = [];
    $('.filter-block .item').each((i, block) => {
        selects.push($(block).text().replace(/\s+/g,' '));
    });
    console.log(selects.slice(0, 10));
    // Let's also find all inputs in filter blocks
    $('input').each((i, el) => {
        if ($(el).attr('name')?.includes('type')) {
            console.log('INPUT:', $(el).attr('name'), $(el).val(), $(el).parent().text().trim());
        }
    });
});
