// const nanoid = require('nanoid');

function getRandomFileName() {
  var timestamp = new Date().toISOString().replace(/[-:.]/g,"");  
  var random = ("" + Math.random()).substring(4, 8); 
  var random_number = timestamp+random;  
  return random_number.slice(14,22);
}

console.log(getRandomFileName());