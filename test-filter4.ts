import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://anikototv.to/filter?type=1').then(r => {
    const $ = cheerio.load(r.data);
    const results = [];
    $('.list-items .item').slice(0, 3).each((i, el) => {
        results.push($(el).find('.name').text().trim() + ' - ' + $(el).find('.fdi-item').first().text().trim());
    });
    console.log('Type 1 (Movie?):', results);
});
axios.get('https://anikototv.to/filter?type=2').then(r => {
    const $ = cheerio.load(r.data);
    const results = [];
    $('.list-items .item').slice(0, 3).each((i, el) => {
        results.push($(el).find('.name').text().trim() + ' - ' + $(el).find('.fdi-item').first().text().trim());
    });
    console.log('Type 2 (TV?):', results);
});
