/* global app */

// eslint-disable-next-line no-unused-vars
function addIndex (colidx, index) {
  console.log(`Add Index ${colidx} ${index}`)
  // Create a new index
  const fname = app.collections[colidx].fields[index]
  console.log(app.collections)
  console.log(app.selectedIndex)
  if (app.selectedIndex && colidx === app.selectedIndex.collection && app.selectedIndex.fields.includes(fname) === false) {
    app.selectedIndex.fields.push(fname)
  } else {
    app.indexes.push({ collection: colidx, fields: [fname] })
  }
}
// eslint-disable-next-line no-unused-vars
function deleteIndex (indexidx) {
  app.indexes.splice(indexidx, 1)
  app.selectedIndex = null
}

// eslint-disable-next-line no-unused-vars
function selectIndex (indexidx) {
  console.log(`Select index ${indexidx}`)
  app.selectedIndex = app.indexes[indexidx]
}
