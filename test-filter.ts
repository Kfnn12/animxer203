import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://anikototv.to/filter').then(r => {
    const $ = cheerio.load(r.data);
    console.log('Genres:');
    $('.filter-block').each((i, block) => {
        if ($(block).find('.text-white').text().includes('Genre')) {
            $(block).find('.item').each((j, item) => {
                const name = $(item).find('label').text().trim();
                const val = $(item).find('input').val();
                console.log('Genre:', name, val);
            });
        }
        if ($(block).find('.text-white').text().includes('Type')) {
             $(block).find('.item').each((j, item) => {
                const name = $(item).find('label').text().trim();
                const val = $(item).find('input').val();
                console.log('Type:', name, val);
            });
        }
    })
});
