const express = require('express');
const app = express();

app.use(express.json());

const DEFAULT_TTL = 120;
const urlStore = new Map();
const analyticsStore = new Map();
const ttlStore = new Map();

function generateNewAlias() {
  let timestamp = new Date().toISOString().replace(/[-:.]/g,"");  
  let random = ("" + Math.random()).substring(4, 8); 
  let random_number = timestamp+random;  
  return random_number.slice(14,22); 
}

app.post('/shorten',(req,res) => {
  const { original_url,custom_alias,ttl = DEFAULT_TTL} = req.body;
  let alias = custom_alias || generateNewAlias();

  while(urlStore.has(alias)) {
    alias = generateNewAlias();
  }

  const expiryTime = Date.now() + ttl*1000;

  urlStore.set(alias,original_url);
  analyticsStore.set(alias,{ count:0,access_time:[]});
  ttlStore.set(alias,expiryTime);

  res.json({shorten_url:`http://localhost:3000/${alias}`});

});

app.get('/:alias',(req,res) => {
  const alias = req.params.alias;
  
  if(urlStore.has(alias) && ttlStore.get(alias) > Date.now()) {
    const original_url = urlStore.get(alias);
    const analytics = analyticsStore.get(alias);

    analytics.count++;
    const dateString = new Date().toISOString();
    analytics.access_time.push(dateString);

    res.redirect(original_url);
  } else {
    res.status(404);
  }
});

app.put('/update/:alias',(req,res) => {
  const alias = req.params.alias;
  const { new_custom_alias,new_ttl } = req.body;

  if(urlStore.has(alias)) {
    let newAlias = alias;

    if(new_custom_alias) {
       if(urlStore.has(new_custom_alias)) {
         return res.send("The Custom alias is already in use");
       } 

      newAlias = new_custom_alias;
      urlStore.set(newAlias,urlStore.get(alias));
      urlStore.delete(alias);
      
      analyticsStore.set(newAlias,analyticsStore.get(alias));
      analyticsStore.delete(alias);
      
      ttlStore.set(newAlias,ttlStore.get(alias));
      ttlStore.delete(alias);
    }

    if(new_ttl) {
      ttlStore.set(newAlias,Date.now() + new_ttl*1000);
    }

    res.send("Update Successfull");
  } else {
    res.status(404);
  }
})

app.get('/analytics/:alias',(req,res) => {
    const alias = req.params.alias;

    if(analyticsStore.has(alias)) {
      const { count,access_time } = analyticsStore.get(alias);
      res.json({count,access_time:access_time.slice(-10)});
    } else {
      res.status(404);
    }
});

app.delete('/delete/:alias',(req,res) => {
  const alias = req.params.alias;

  if(urlStore.has(alias)) {
    urlStore.delete(alias);
    analyticsStore.delete(alias);
    ttlStore.delete(alias);

    res.send('Deleted Successfull');
  } else {
    res.status(404);
  }
})

app.listen(3000,() => {
  console.log("Server running!!");
});