/* This is a different menating fo upsert versus MongoDB term */
/* Here we mean - add extra information to existing information */
/* Insert by updating - sort of , could be updates ($push) or insert */
/* For example Add a new address to a person */
/* We use update() for change all existing values of X */

/* global logExplain, termsInIndex, C_MEM_INDEXFETCH, C_INDEX_CARDINALITY, C_MEM_DOCFETCH, C_COLLECTION_SIZE, C_DOCWRITE, C_INDEXWRITE, C_FIXED_CALL_COSTS ,C_OPS_PERCPU, C_WRITECOST_PER_FIELD, C_FIXED_CALL_COSTS */

/* Code will eb very similar to the insert code - but a field in an array works differently */

// eslint-disable-next-line no-unused-vars
function upsertPerfTest (op, collections, constraints) {
  const fieldsStillToWrite = {}
  const cpu = 20
  const iops = 50
  const ram = 20
  let writeCost = 0
  const lvl = constraints.level
  // console.log(op)
  for (const f in op.fields) {
    fieldsStillToWrite[f] = true
  }

  for (const c of collections) {
    let isUpdateNotInsert = false
    let indexesAffectedByUpdate = 0
    let fieldsWritten = 0
    // Does this collection contain any of the fields I need to write
    for (const fld in op.fields) {
      console.log(`Does ${fld} exisst in ${c.fields}`)
      if (c.fields.includes(fld)) {
        console.log('yes')
        if (lvl.keys.includes(fld)) {
          fieldsStillToWrite[fld] = false
          fieldsWritten++
          console.log('it\'s a key so gets written')
        } else {
          // We can only write a field with a supporting key
          for (const k of lvl.keys) {
            if (c.fields.includes(k)) {
              if (lvl.cardinalities[k] && lvl.cardinalities[k][fld]) {
                fieldsStillToWrite[fld] = false
                console.log(`${fld} keyed by ${k}`)
                if (c.arrays.includes(fld)) {
                  console.log(`${fld} in ${c.fields} is an array so this is a $push`)
                  isUpdateNotInsert = true
                  fieldsStillToWrite[fld] = false
                  // How many index will ou update impact
                  for (const idx of c.indexes) {
                    if (idx.includes(fld)) {
                      console.log(`Need to add entry in index ${idx}`)
                      indexesAffectedByUpdate++
                    }
                  }
                }
              } else {
                console.log('Will be an insert into this collection updating all indexes')
                indexesAffectedByUpdate = c.indexes.length
                fieldsStillToWrite[fld] = false
              }
              fieldsWritten++
              break // for( const k of lvl.keys )
            }
          }
        }
      }
    }

    console.log(`Fields Written ${fieldsWritten}`)
    if (fieldsWritten > 0) {
      let thisCost = 0
      if (isUpdateNotInsert) {
        // In an upadte we are rewriting the whole doc so an array is more costly
        // TODO -take that into account

        // Compute doc size
        let docSizeToWrite = 0

        let fSize
        for (const fld of c.fields) {
          console.log(`Checking cardinaity for ${fld}`)
          let fieldValueSize = 1
          let cardinality = 1

          if (lvl.fieldsizes[fld]) { fieldValueSize = lvl.fieldsizes[fld] }

          if (c.arrays.includes(fld)) {
            console.log(` ${fld} is an array`)
            for (const k of lvl.keys) {
              console.log(`Supported by ${k}?`)
              if (c.fields.includes(k)) {
                console.log(`${k} is present in collection`)
                if (lvl.cardinalities[k] && lvl.cardinalities[k][fld]) {
                  console.log(`Key: ${k} Supports ${fld} at ${lvl.cardinalities[k][fld]}`)
                  cardinality = lvl.cardinalities[k][fld]
                  break
                }
              }
            }
          }
          fSize = fieldValueSize * cardinality
          console.log(` ${fld} val ${fieldValueSize} * card ${cardinality} = ${fSize}`)
          docSizeToWrite += fSize
        }
        thisCost += docSizeToWrite * C_WRITECOST_PER_FIELD
        thisCost += C_DOCWRITE
        thisCost += (indexesAffectedByUpdate) * C_INDEXWRITE
        // What will the find cost us for the update
        const queryFields = Object.keys(op.query)

        let updateFindCost = (C_COLLECTION_SIZE * C_MEM_DOCFETCH) // Collscan

        for (const indexFields of [...c.indexes, [c.fields[0]]]) {
          const { indexPrefix, indexedFields } = termsInIndex(queryFields, indexFields)
          let indexEfficiency
          let fetchEfficiency
          if (indexPrefix === queryFields.length) {
            logExplain('Perfect 1:1 Index available')
            indexEfficiency = 1 /* Perfect 1:1 index */
            fetchEfficiency = 1
          } else {
            if (indexPrefix > 0) {
              logExplain(`Partial 1:1 Index available looking at ${C_INDEX_CARDINALITY} too many docs`)
              indexEfficiency = C_INDEX_CARDINALITY /* Basically 10X the ammount of work but can use index */
              fetchEfficiency = C_INDEX_CARDINALITY /* Have to fetch more */
              if (indexedFields === queryFields.length) {
                /* Unexpectedly good as we have more index reads but no extra doc reads */
                logExplain(`Index has fields but not at start, looking at ${C_INDEX_CARDINALITY} to many keys `)
                indexEfficiency = C_INDEX_CARDINALITY
                fetchEfficiency = 1
              }
            }
          }
          if (indexEfficiency > 0) {
            let costOfUsingThisIndex = (C_MEM_INDEXFETCH * indexEfficiency)
            costOfUsingThisIndex += C_MEM_DOCFETCH * fetchEfficiency
            if (costOfUsingThisIndex < updateFindCost) { updateFindCost = costOfUsingThisIndex }
          }
        }
        thisCost += updateFindCost

        console.log(`Update in  Collection: ${c.fields} costs ${thisCost} (${updateFindCost} to locate) + overhead`)
        thisCost += C_FIXED_CALL_COSTS // Network overhead
      } else {
        // It's an insert
        let docSizeToWrite = 0
        console.log(lvl)
        for (const fld of c.fields) {
          if (lvl.fieldsizes[fld]) { docSizeToWrite += lvl.fieldsizes[fld] } else { docSizeToWrite += 1 }
        }
        thisCost = docSizeToWrite * C_WRITECOST_PER_FIELD
        thisCost += C_DOCWRITE
        thisCost += (c.indexes.length + 1) * C_INDEXWRITE
        console.log(`Insert to Collection: ${c.fields} costs ${thisCost} + overhead`)
        thisCost += C_FIXED_CALL_COSTS // Network overhead
      }

      writeCost += thisCost
    }
  }

  // Check if we have written all the fields we need to
  for (const f in op.fields) {
    if (fieldsStillToWrite[f] === true) {
      return { possible: false, msg: 'Not all required fields existed in the schema or you were missing some relationship keys' }
    }
  }

  console.log(`Total writeCost ${writeCost}`)
  const performance = Math.floor(C_OPS_PERCPU / writeCost)

  return { possible: true, performance, target: op.target, cpu, ram, iops }
}
