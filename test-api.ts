import axios from 'axios';
axios.get('https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://anikototv.to/filter')).then(res => console.log(res.data.substring(0, 100))).catch(e => console.error(e.message));
