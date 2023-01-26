// This function estimates the performanc of the given query using the supplied schrma
// and the constraints object supplied

// This is an implementation of a interesting set of heuristics - see below

/* Calculate a value as to what percentage of operations are a cache miss */
/* This will relate to how much larger the working set is than the cache */
/* It's prety naieve as it assumes all collections are used and all indexes are used */
/* Being out of cache impacts writes as well as reads */
const C_AVG_ARRAY_SIZE = 30
const C_FIELD_SIZE = 1
const C_DETAIL_FIELD_SIZE = 20
const C_COLLECTION_SIZE = 1000000

const explainPlan = []


function calcDataSize (collections, constraints) {
  let dataSize = 0
  for (const c of collections) {
    let colSize = 0
    let idxSize = 0
    for (const f of c.fields) {
      let fsize = C_FIELD_SIZE /* 1 Standard Field */
      if (f.includes('Details')) { fsize = C_DETAIL_FIELD_SIZE } /* A fieldname that is 'Details' is considered to be larger */
      if (c.arrays.includes(f)) { fsize = fsize * C_AVG_ARRAY_SIZE }
      colSize += fsize
    }
    dataSize += colSize
    // Work out the index size
    for (const i of c.indexes) {
      for (const f of i) {
        let fsize = C_FIELD_SIZE /* 1 Standard Field in index */
        if (f.includes('Details')) { fsize = C_DETAIL_FIELD_SIZE }
        if (c.arrays.includes(f)) { fsize = fsize * C_AVG_ARRAY_SIZE }
        idxSize += fsize
      }
      dataSize += idxSize
    }
  }
  logExplain(`Calculated Data Size ${dataSize}`)
  /* A fieldname that is 'Details' is considered to be larger */
  return dataSize
}

function logExplain(msg) {
  explainPlan.push(JSON.stringify(msg))
}

// eslint-disable-next-line no-unused-vars
function perfTest (op, collections, constraints) {
  // console.log('Testing performance')
  // console.log(JSON.stringify(op))

  let opResult
  explainPlan.length=0;

  if (op.op === 'exact') {
    return exactTest(op, collections, constraints)
  }

  const dataSize = calcDataSize(collections)

  if (op.op === 'find') {
    logExplain(op)
    opResult = findPerfTest(op, collections, constraints)
    logExplain(opResult)
    if (opResult.possible === false) {
      return { msg: 'It\'s not possible to perform the operations with that schema', ok: false }
    }
  } else {
    // TODO - Add Update/Insert Speed tests

    return { msg: `Operations type ${op.op} is not supported`, ok: false }
  }
  console.log(explainPlan.join('\n'))
  return opResult
}

/* Some Handy Array Functions */

function arrayContainsSet (array1, array2) {
  // True if array1 contains all the values in array2
  for (const val of array2) {
    if (!array1.includes(val)) {
      return false
    }
  }
  return true
}

function arrayIsSet (array1, array2) {
  // True if Array1 and Array2 have all the same fields
  if (arrayContainsSet(array1, array2) && array1.length === array2.length) {
    return true
  }
  return false
}

/* Given a set of ordered index fields and unordered query fields, how efficiently can you use the index */
/* return 2 values, length of prefix and total number of indexed fields */

function termsInIndex (queryFields, indexFields) {
  let indexPrefix = 0
  let indexedFields = 0
  let missing = false

  for (const fld of indexFields) {
    if (queryFields.includes(fld)) {
      indexedFields++
      if (missing === false) {
        indexPrefix++
      }
    } else {
      missing = true
    }
  }

  return { indexPrefix, indexedFields }
}

function findPerfTest (op, collections, constraints) {
  // To do this we need to be able to query by the query fields and fetch the project fields
  // They don't all need to be in the same collection - as long as there is a way to join them
  // A join will hurt though especially if not indexed

  let limit = 1; /* By default we fectch a single document */
  if (op.limit > 0) { limit = op.limit }

  const queryFields = Object.keys(op.query) /* For now assuming exact match */
  const projectFields = Object.keys(op.project)

  // console.log(`Query by ${queryFields}, Fetch: ${projectFields}`)

  const requiredFields = new Set([...queryFields, ...projectFields]) /* We need to get all of these from one collection for now */

  // Check if any single collection has all the required fields
  // If multiples do we will need to test them all and take the best one

  // TODO - return a huge explanation of all this we can render to the user

  let bestPerf = { cost: Infinity }

  for (const collection of collections) {
    const cFields = collection.fields
    // console.log(`Collection: ${cFields}`)

    if (arrayContainsSet(cFields, requiredFields)) {
      // console.log('Collection has all required fields')
      const fetchCost = testFetchSpeed(collection, queryFields, projectFields, limit, constraints)
      // console.log(`With ${collection.fields} - performance is ${fetchCost.cost}`)
      if (fetchCost.cost < bestPerf.cost) {
        bestPerf = fetchCost
      }
    }
  }
  if (bestPerf.cost === Infinity) {
    return { possible: false }
  }

  // TODO - not hard code Resource usage
  return { possible: true, performance: Math.ceil(C_OPS_PERCPU / bestPerf.cost), target: op.target, cpu: bestPerf.cpu, ram: bestPerf.ram, iops: bestPerf.iops }
}

const C_OPS_PERCPU = 12500
const C_MEM_INDEXFETCH = 1 /* 1 Time unit to fetch from an index entry in memory */
const C_MEM_DOCFETCH = 5 /* Time to fetch a document from cache */
const C_MEM_COLLECTIONSCAN = 400 /* Need to incorporate DB size, assume 10000 for */
const C_INDEX_CARDINALITY = 10 /* { a:1, b:1 } - ave number of b per value of a */
/* Here we have a collection that contains all the fields we need - how fast can we fetch from it */

function testFetchSpeed (collection, queryFields, projectFields, limit, constraints) {
  /* Things we will compute */
  let cpu = 5
  let ram = 5
  let iops = 5

  // This assumes that we have a collection with all the required query and projection fields
  // So it's either an indexed query, a pertially indexed query and scan or a collection scan
  const availableIndexes = [[collection.fields[0]]] // This is _id
  // Add any indexes that are on this collection

  for (const index of collection.indexes) {
    availableIndexes.push(index)
  }

  const nQueryFields = queryFields.length
  let bestCostPerOp = Infinity

  for (const index of availableIndexes) {
    // Does it start with ALL of the query fields (Which can be in any order) - Perfect index
    let costPerOp = 0

    const { indexPrefix, indexedFields } = termsInIndex(queryFields, index)

    // console.log(`Can use ${indexPrefix} prefix fields and ${indexedFields} total of ${nQueryFields} required`)

    // Compute index efficiency
    // Perfect index = 1
    // Partial index - depends on cardinality but let's say 10 and has fetch
    // All fields but with gap is pretty good, let's say 2 - and no fetch
    let indexEfficiency = 0 /* Index unusable */
    let fetchEfficiency = 0 /* This shoudl be a collscan */

    if (indexPrefix === nQueryFields) {
      indexEfficiency = 1 /* Perfect 1:1 index */
      fetchEfficiency = 1
    } else {
      if (indexPrefix > 0) {
        indexEfficiency = C_INDEX_CARDINALITY /* Basically 10X the ammount of work but can use index */
        fetchEfficiency = C_INDEX_CARDINALITY /* Have to fetch more */
        if (indexedFields === nQueryFields) {
          /* Unexpectedly good as we have more index reads but no extra doc reads */
          indexEfficiency = C_INDEX_CARDINALITY
          fetchEfficiency = 1
        }
      }
    }

    // console.log(`indexRatio: ${indexEfficiency}, fetchRatio: ${fetchEfficiency}`)
    /* If the index covers all the projected fields too then no need to fetch is free */
    let covered = true
    for (const pField of projectFields) {
      // console.log(`Additional fields to check if covered ${projectFields}`)
      // Check not array too
      if (!index.includes(pField) || collection.arrays.includes[pField]) {
        covered = false
      }
    }

    // TODO - Calculate Cache Size, Data Size, Working Set and therefor probability of a cache miss
    // From that we can slow by a %tage

    if (indexEfficiency > 0) {
      // We use an Index
      // 'efficiency' Index Lookup per Document (Multiplied by number of docs we are fetching)
      costPerOp = C_MEM_INDEXFETCH * limit * indexEfficiency

      if (!covered) {
        // console.log('Query is indexed but not covered')
        costPerOp += C_MEM_DOCFETCH * limit * fetchEfficiency
      } else {
        console.log('Query is covered')
      }
      // TODO - Compute these
      cpu = 80
      iops = 2
      ram = 10
    } else {
      /* No index == collection scan , assume 100% disk based too */

      cpu = 99
      iops = 99
      ram = 50

      // console.log('Query is collection scan')
      costPerOp = C_MEM_COLLECTIONSCAN // TODO - Change this to relative to collection size
      // TODO - Make this 100% disk use and high CPU
    }
    // console.log(costPerOp)
    // If it's less than we have partial indexing˘
    if (costPerOp <= bestCostPerOp) {
      bestCostPerOp = costPerOp
    }
  }

  return { cost: bestCostPerOp, cpu, ram, iops }
}

function exactTest (op, collections, constraints) {
  /* Check we have exactly what is specified */
  /* Specifically for each list of fields we have a collection with that list
    and the same first element , this is only really for the tutorial levels */

  for (const requiredcollection of op.collections) {
    let matchedfields = false
    let matchedarrays = !requiredcollection.arrays // True if we dont have arrays
    for (const checkcollection of collections) {
      console.log('checking', checkcollection)
      // Must Exactly Match first value
      if (checkcollection.fields[0] === requiredcollection.fields[0]) {
        if (arrayIsSet(requiredcollection.fields, checkcollection.fields)) {
          matchedfields = true
          /* If we had the fields check we have the required arrays */
          if (requiredcollection.arrays) {
            for (const requiredarray of requiredcollection.arrays) {
              if (checkcollection.arrays.includes(requiredarray)) {
                matchedarrays = true
              }
            }
          }
        }
      }
    }
    // Fail if we didnt find something with all the fields and arrays
    if (matchedfields === false || matchedarrays === false) return { msg: 'That\'s not quite right', ok: false }
  }
  return { ok: true }
}
