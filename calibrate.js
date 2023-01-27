// This is just some stuff I ran in a shell to see how fast an M10 is

for (b = 0; b < 100; b++) {
  const batch = []
  for (d = 0; d < 1000; d++) {
    const details = {}
    for (f = 0; f < 20; f++) {
      let txt = ''
      while (Math.random() > 0.07) {
        txt += String.fromCharCode(Math.floor(Math.random() * 32) + 94)
      }
      details[`field${f}`] = txt
    }
    const rec = { city: `${Math.floor(Math.random()* 20)}_cityname`, state: `${Math.floor(Math.random()* 20)}_state`, details }
    batch.push(rec)
  }
  db.test.insertMany(batch)
}

db.test.createIndex({ city: 1 })
db.test.createIndex({ city:1, state: 1 })


function pipeline()
{
    return [{$match:{ state:  `${Math.floor(Math.random()* 20)}_state`, city: `${Math.floor(Math.random()* 20)}_cityname` }},{$group:{_id:1,x:{$max:"$z"}}}]
}
(async () => {
  const parallel = 100
  const iters = 30
  start = new Date()
  for (x = 0; x < iters; x++) {
    promises = []
    for(p=0;p<parallel;p++) { promises.push((async () => { return db.test.aggregate([...pipeline(),{$limit:300}]).itcount()})())}
    await Promise.all(promises)
  }
  end = new Date()
  print(`${1000*parallel*iters / (end - start )} ops/s`)
})()



  Colscan 24.3 Ops/satisfies - 100% CPU 
  Part index - 176 ops/s 92% CPU - 
  Full indx - 839 ops/s (300 docs) 1075 (single doc)


