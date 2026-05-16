import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://anikototv.to/filter').then(r => {
    const $ = cheerio.load(r.data);
    const results = [];
    $('input[name="genre[]"]').each((i, el) => {
         const val = $(el).val();
         const label = $(el).next('label').text().trim() || $(el).parent().text().trim();
         console.log('Genre', val, label);
    });
    $('input[name="type[]"], input[name="type"]').each((i, el) => {
         const val = $(el).val();
         const label = $(el).next('label').text().trim() || $(el).parent().text().trim();
         console.log('Type', val, label);
    });
    $('select[name="type"] option, select[name="type[]"] option').each((i, el) => {
         const val = $(el).val();
         const label = $(el).text().trim();
         console.log('Type Select', val, label);
    });
});
