/* global app */

// eslint-disable-next-line no-unused-vars
function addIndex (colidx, index) {
  const fname = app.collections[colidx].fields[index]
  console.log(`Add Index ${colidx} ${index} ${fname}`)
  console.log(JSON.stringify(app.selectedIndex))
  if (app.selectedIndex && app.collections[colidx] === app.selectedIndexCollection && app.selectedIndex.includes(fname) === false) {
    app.selectedIndex.push(fname)
  } else {
    app.collections[colidx].indexes.push([fname])
    console.log(app.collections)
  }
}
// eslint-disable-next-line no-unused-vars
function deleteIndex (colidx, indexidx) {
  app.collections[colidx].indexes.splice(indexidx, 1)
  app.selectedIndex = null
}

// eslint-disable-next-line no-unused-vars
function selectIndex (colidx, indexidx) {
  if (!app.flags.compound) return
  console.log(colidx, indexidx)
  console.log(JSON.stringify(app.collections))
  app.selectedIndex = app.collections[colidx].indexes[indexidx]
  app.selectedIndexCollection = app.collections[colidx]
}
