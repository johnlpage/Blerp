
// This _Should_ be much simpler than find()
// We need to ensure all the required fields are written
// We need to update a field everywhere it appears
// We can only add a field to a collection where it's key exists in that collection

// We can have a fixed cost or a size based cost for writing a collection
// And for each collection we have a cost for each index

/* global C_DOCWRITE, C_INDEXWRITE, C_FIXED_CALL_COSTS ,C_OPS_PERCPU, C_WRITECOST_PER_FIELD, C_FIXED_CALL_COSTS */

// eslint-disable-next-line no-unused-vars
function insertPerfTest (op, collections, constraints) {
  const fieldsStillToWrite = {}
  let writeCost = 0
  const lvl = constraints.level
  // console.log(op)
  for (const f in op.fields) {
    fieldsStillToWrite[f] = true
  }

  for (const c of collections) {
    // console.log(c)
    // console.log(`Checking if we have to write to ${c.fields} `)

    let fieldsWritten = 0
    // Does this collection contain any of the fields I need to write
    for (const fld in op.fields) {
      if (c.fields.includes(fld)) {
        // console.log(`${fld} is in collection ${c.fields}`)
        if (lvl.keys.includes(fld)) {
          // console.log(`${fld} is a Key so can write (may not make sense though)`)
          fieldsStillToWrite[fld] = false
          fieldsWritten++
        } else {
          for (const k of lvl.keys) {
            if (c.fields.includes(k)) {
              if (lvl.cardinalities[k] && lvl.cardinalities[k][fld]) {
                // const cardinality = lvl.cardinalities[k][fld]
                // Does cardinality have an impact on insert?
                // Not if we insert only the first array entry on create
                // Might impact update though as it grows
                // console.log(`We can write ${fld} in collection due to ${k}`)
                fieldsStillToWrite[fld] = false

                fieldsWritten++
              }
            }
          }
        }
      }
    }
    if (fieldsWritten > 0) {
      // Cost is 1 Write unit plus 1 write per index on that collection (inc _id)
      // Still assuming working set holds index for now and no find op is required
      // There is actually an index lookup on _id we might want to account for
      // Or agruably and index lookup on each index but we can factor that in the
      // write cose
      let thisCost = fieldsWritten * C_WRITECOST_PER_FIELD
      thisCost += C_DOCWRITE
      thisCost += (c.indexes.length + 1) * C_INDEXWRITE
      thisCost += C_FIXED_CALL_COSTS  // Network overhead
      // Also an overhead for each write - assume no batching
      console.log(`Writing to Collection: ${c.fields} costs ${thisCost}`)
      writeCost += thisCost
    }
  }

  // Check if we have written all the fields we need to
  for (const f in op.fields) {
    if (fieldsStillToWrite[f] === true) {
      return { possible: false, msg: 'Not all required fields existed in the schema or you were missing some relationship keys' }
    }
  }

  const cpu = 20
  const iops = 100
  const ram = 20
  console.log(`Total writeCost ${writeCost}`)
  const performance = Math.floor( C_OPS_PERCPU / writeCost )

  return { possible: true, performance, target: op.target, cpu, ram, iops }
}
