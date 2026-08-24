const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.css');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  if (!f.includes('index.css')) {
    content = content.replace(/@import url\(['`"].+?fonts\.googleapis\.com.+?['`"]\);?\n?/g, '');
    content = content.replace(/[ \t]*font-family:[^;]+;?\n?/g, '');
  }

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed fonts in:', f);
  }
});
