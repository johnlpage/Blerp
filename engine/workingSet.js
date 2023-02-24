/* global C_FIELD_SIZE , logExplain */

// eslint-disable-next-line no-unused-vars
function calcDataSize (collections, level) {
  let totalDataSize = 0
  let totalIdxSize = 0
  for (const c of collections) {
    let collSize = 0
    let idxSize = 0
    let docIdxSize = 1 // _id

    let documentSize = 0
    let firstField = true
    let nDocs = 1
    for (const f of c.fields) {
      // console.log(f)
      let fieldSize = C_FIELD_SIZE /* 1 Standard Field */

      if (level.fieldsizes && level.fieldsizes[f] > 1) {
        fieldSize = fieldSize * level.fieldsizes[f] // Larger than average fields
        // console.log(`Larger field ${fieldSize} units`)
      }

      /* IF the field isn't a Key we need to work out if it's in here and how many records
           or array elements that makes */
      let nullField = false
      if (level.keys && level.keys.includes(f) === false && !firstField) {
        // console.log(`Checking if we can include ${f}`)
        nullField = true
        for (const k of level.keys) {
          if (c.fields.includes(k)) {
            // Can we include this field in here at all?
            // Only if it has a relationship to a key that is here
            // console.log(`Seing if it's supported by ${k}`)
            const cardinality = level.cardinalities[k][f]
            if (cardinality > 0) {
              nullField = false
              // console.log(`Record contains ${k} so ${cardinality} values for ${f} (ave)`)
              if (c.arrays.includes(f)) {
                // console.log('It\'s an array - so multiplying field size')
                fieldSize = fieldSize * cardinality
              } else {
                // Not an Array so more documents
                // Simple but weird option we need to have docs for all combinations so we multiply up the doc multiplyer
                // So if a person has 3 phone numbers and 5 orders and we add both as single fields
                // We end up with 15 records - which si horrible but needed
                nDocs = nDocs * cardinality
              }
            }
          }
        }
      }
      firstField = false
      if (!nullField) {
        documentSize += fieldSize
        // Add fieldSize to Index SIze for all the indexes it's in
        for (const index of c.indexes) {
          for (const idxfield of index) {
            if (idxfield === f) {
              docIdxSize = docIdxSize + fieldSize
            }
          }
        }
      } else {
        // console.log('Nope!')
      }
    }
    // Now work out the collection size
    // console.log(`Each Key is ${nDocs} documents at ${documentSize} units `)
    // console.log(`Indexes ${docIdxSize} units `)
    collSize = documentSize * nDocs
    idxSize = docIdxSize * nDocs

    logExplain(`Collection ${c.fields} size ${collSize} indexes ${idxSize} `)
    totalDataSize += collSize
    totalIdxSize += idxSize
  }
  // console.log({ totalDataSize, totalIdxSize })
  return { totalDataSize, totalIdxSize }
}
