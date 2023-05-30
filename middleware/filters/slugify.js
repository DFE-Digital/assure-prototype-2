const slugify = require('slugify');

function slugifyFilter(value) {
  return slugify(value, {
    lower: true, 
    remove: /[*+~.()'"!:@]/g, 
    replacement: '-', 
  });
}

module.exports = slugifyFilter;