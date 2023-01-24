// This function estimates the performanc of the given query using the supplied schrma
// and the constraints object supplied

// TODO - Outline/Plan to werite this code
// Find
//    Identify any usable collections
//    Using _id Index versus collscan
//    Using Partial Index Prefix
//    Using Partial Impact prex + other fields
//    Impact of a covering index
//    Impact of %tage reads not from cache
//    Support for variable IOPS
//    Support for requiring a JOIN of some kind

// This is an implementation of a interesting set of heuristics - see below
/* global app */

// eslint-disable-next-line no-unused-vars
function perfTest (op, collections, constraints) {
  console.log('Testing performance')
  console.log(JSON.stringify(op))
  console.log(JSON.stringify(collections, null, 2))
  let findOp
  if (op.op === 'exact') {
    /* Check we have exactly what is specified */
    /* Specifically for each list of fields we have a collection with that list
    and the same first element , this is only really for the tutorial levels */

    for (const testcollection of op.collections) {
      console.log('testing', JSON.stringify(testcollection))
      let matchedfields = false
      let matchedarrays = true
      for (const checkcollection of collections) {
        console.log('checking', checkcollection)
        if (checkcollection.fields[0] === testcollection.fields[0]) {
          const intersection = testcollection.fields.filter(value => checkcollection.fields.includes(value))
          if (intersection.length === testcollection.fields.length) {
            matchedfields = true
            /* If we had the fields check we have the required arrays */
            /* Think logic breaks if we have two collections with fields one without arrays TODO BUG */
            if (testcollection.arrays) {
              for (const ta of testcollection.arrays) {
                if (checkcollection.arrays.includes(ta) === false) {
                  matchedarrays = false
                }
              }
            }
          }
        }
      }
      if (matchedfields === false || matchedarrays === false) return { msg: 'That\'s not quite right', ok: false }
    }
    return { ok: true }
  }
  if (op.op === 'find') {
    findOp = findPerfTest(op, collections, constraints)
    console.log(findOp)
    if (findOp.possible === false) {
      return { msg: 'It\'s not possible to perform the operations with that schema', ok: false }
    }
  } else {
    return { msg: `Operations type ${op.op} is not supported`, ok: false }
  }

  return findOp
}

function findPerfTest (op, collections, constraints) {
  // To do this we need to be able to query by the query fields and fetch the project fields
  // They don't all need to be in the same collection - as long as there is a way to join them
  // A join will hurt though especially if not indexed
  let limit = 101
  if (op.limit > 0) { limit = op.limit }
  const queryFields = Object.keys(op.query)
  const projectFields = Object.keys(op.project)
  console.log(`Query by ${queryFields}, Fetch: ${projectFields}`)
  const allFields = new Set([...queryFields, ...projectFields])
  // Check if any single collection has all the required fields
  // If multiples do we will need to test them all and take the best one
  // TODO - return a huge explanation of all this we can render to the user

  let bestPerf = { cost: Infinity }

  for (const collection of collections) {
    const cFields = collection.fields
    console.log(`Collection: ${cFields}`)
    const intersection = cFields.filter(value => allFields.has(value))
    console.log(`Intersection: ${intersection} AllFields: ${allFields}`)
    if (intersection.length === allFields.size) {
      console.log('Collection contains all required fields')
      const fetchCost = testFetchSpeed(collection, queryFields, projectFields, limit, constraints)

      console.log(`With ${collection.fields} - performance is ${fetchCost.cost}`)
      if (fetchCost.cost < bestPerf.cost) {
        bestPerf = fetchCost
        console.log('Selecting as best option')
      }
    }
  }
  if (bestPerf.cost === Infinity) {
    console.log('No Collection able to satisfy required operation')
    return { possible: false }
  }
  // TODO - not hard code Resource usage
  return { possible: true, performance: Math.ceil(C_OPS_PERCPU / bestPerf.cost), target: op.target, cpu: bestPerf.cpu, ram: bestPerf.ram, iops: bestPerf.iops }
}

const C_OPS_PERCPU = 12500
const C_MEM_INDEXFETCH = 1 /* 1 Time unit to fetch from an index in memory */
const C_MEM_DOCFETCH = 2 /* Time to fetch a document from cache */
const C_MEM_COLLECTIONSCAN = 200 /* Need to incorporate DB size, assume 10000 for */

function testFetchSpeed (collection, queryFields, projectFields, limit, constraints) {
  let cpu = 5
  let ram = 5
  let iops = 5
  // This assumes that we have a collection with all the required query and projection fields
  // So it's either an indexed query, a pertially indexed query and scan or a collection scan
  const availableIndexes = [[collection.fields[0]]] // This is _id
  // Add any indexes that are on this collection
  console.log(collection)
  console.log('ADDING INDEXES')
  for (const index of collection.indexes) {
    availableIndexes.push(index)
    console.log(index)
  }

  const nQueryFields = queryFields.length
  let bestCostPerOp = Infinity
  console.log(`Testing find and fetch of ${limit}`)
  for (const index of availableIndexes) {
    // Does it start with ALL of the query fields (Which can be in any order) - Perfect index
    let costPerOp = 0
    const usableIndex = termsInIndex(queryFields, index)
    console.log(`Can use ${usableIndex} prefix fields of ${nQueryFields} requuired`)

    if (usableIndex === nQueryFields) {
      // If Number of Prefix fields in index is equal to query then we have 1:1 indexing

      costPerOp = C_MEM_INDEXFETCH * limit
      // TODP add covering here
      costPerOp += C_MEM_DOCFETCH * limit
      cpu = 80
      iops = 2
      ram = 10
    } else {
      cpu = 99
      iops = 99
      ram = 50
      costPerOp = C_MEM_COLLECTIONSCAN // TODO - Change this to relative to collection size
      // TODO - Make this 100% disk use and high CPU
    }
    console.log(costPerOp)
    // If it's less than we have partial indexing˘
    if (costPerOp <= bestCostPerOp) {
      bestCostPerOp = costPerOp
    }
  }
  return { cost: bestCostPerOp, cpu, ram, iops }
}

/* Given a set of ordered index firlds and unordered query fields, how efficiently can you use the index */

function termsInIndex (queryFields, indexFields) {
  const nQueryFields = queryFields.length
  const nIndexFields = indexFields.length
  console.log(`Trying query for {${queryFields}} with {${indexFields}}`)
  for (let term = 0; term < nIndexFields && term < nQueryFields; term++) {
    if (queryFields.includes(indexFields[term]) === false) {
      return term
    }
  }
  // If we got here - then all index used
  return nIndexFields
}
