const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('c:/Users/vihar/OneDrive/Desktop/stock market/frontend/src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if(file.endsWith('.jsx')) { 
            results.push(file); 
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    if (content.includes("import axios from 'axios'")) {
        // Calculate relative import to api.js
       const apiPath = path.resolve(srcDir, 'lib/api.js');
       let rel = path.relative(path.dirname(f), apiPath).replace(/\\/g, '/');
       if (!rel.startsWith('.')) rel = './' + rel;

       content = content.replace(/import axios from 'axios';?/g, `import api from '${rel}';`);
       
       // Replace GETs
       content = content.replace(/axios\.get\(\s*[`']http:\/\/localhost:5000\/api(.*?)[`'](?:,\s*\{\s*headers:\s*\{.*?\s*\}\s*\})?\s*\)/g, 'api.get(`$1`)');
       // Without template literal fallback
       content = content.replace(/axios\.get\(\s*(`?http:\/\/localhost:5000\/api[^`']+`?)(?:,\s*\{\s*headers:\s*\{.*?\s*\}\s*\})?\s*\)/g, (match, url) => {
           const relativeUrl = url.replace(/http:\/\/localhost:5000\/api/g, "");
           return `api.get(${relativeUrl})`;
       });

       // Now for generic ones that just pass options object
       content = content.replace(/axios\.get\((.*?), \{ headers:.*\}\)/g, 'api.get($1)');

       // Replace POSTs
       content = content.replace(/axios\.post\(\s*[`']http:\/\/localhost:5000\/api(.*?)[`'],\s*(.*?)(?:,\s*\{\s*headers:\s*\{.*?\s*\}\s*\})?\s*\)/g, 'api.post(`$1`, $2)');
       content = content.replace(/axios\.post\(\s*(`?http:\/\/localhost:5000\/api[^`']+`?),\s*(.*?)(?:,\s*\{\s*headers:\s*\{.*?\s*\}\s*\})?\s*\)/g, (match, url, payload) => {
           const relativeUrl = url.replace(/http:\/\/localhost:5000\/api/g, "");
           return `api.post(${relativeUrl}, ${payload})`;
       });
       
       // General fallback for any remaining axios
       content = content.replace(/axios\./g, 'api.');

       fs.writeFileSync(f, content);
       console.log('Patched', f);
    }
});
