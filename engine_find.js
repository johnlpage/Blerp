
/* global logExplain, arrayContainsSet,C_OPS_PERCPU , termsInIndex,C_INDEX_CARDINALITY  */
/* global C_CACHE_MISS_FETCH_COST , C_MEM_INDEXFETCH, C_MEM_DOCFETCH,
 C_COLLECTION_SIZE, C_FIXED_CALL_COSTS, C_MEM_COLLSCAN_BONUS */

// eslint-disable-next-line no-unused-vars
function findPerfTest (op, collections, constraints) {
  // To do this we need to be able to query by the query fields and fetch the project fields
  // They don't all need to be in the same collection - as long as there is a way to join them
  // A join will hurt though especially if not indexed

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
      const fetchCost = testFetchSpeed(collection, queryFields, projectFields, op, constraints)
      logExplain(`With ${collection.fields} - performance is ${fetchCost.cost}`)
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

// MEasuting on a single CPU M10 with 100,000 docs and fetching 300
// Colscan = 21 ops/s (100,000 doc reads) - 2.1M Reads/s
// Partial Index (10% cardinality) = 150 ops/s ( 6000 index reads + 6000 doc reads)  2.1M reads/s
// Full index = 836 ops/s ( 300 index reads + 300 doc reads) - ~500,000 reads/s
// Covering index 1600 ops/s (300 index reads)  - 480,000 index reads/s

// From RAM - index and doc read cost is same

/* Here we have a collection that contains all the fields we need - how fast can we fetch from it */

function testFetchSpeed (collection, queryFields, projectFields, op, constraints) {
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

  //  Now we need to multiply by how many records we need to get the
  // Projection fields and if >1 and not array set multiplier
  let numRecsRequiredForResult = 1
  for (const pf in op.project) {
    if (op.project[pf] > numRecsRequiredForResult &&
            collection.arrays.includes(pf) === false) {
      numRecsRequiredForResult = op.project[pf]
    }
  }

  const nQueryFields = queryFields.length
  let bestCostPerOp = Infinity

  for (const index of availableIndexes) {
    // Does it start with ALL of the query fields (Which can be in any order) - Perfect index
    let costPerOp = 0

    const { indexPrefix, indexedFields } = termsInIndex(queryFields, index)

    logExplain(`Can use ${indexPrefix} prefix fields and ${indexedFields} total of ${nQueryFields} required`)

    // Compute index efficiency
    // Perfect index = 1
    // Partial index - depends on cardinality but let's say 10 and has fetch
    // All fields but with gap is pretty good, let's say 2 - and no fetch
    let indexEfficiency = 0 /* Index unusable */
    let fetchEfficiency = 0 /* This shoudl be a collscan */

    if (indexPrefix === nQueryFields) {
      logExplain('Perfect 1:1 Index available')
      indexEfficiency = 1 /* Perfect 1:1 index */
      fetchEfficiency = 1
    } else {
      if (indexPrefix > 0) {
        logExplain(`Partial 1:1 Index available looking at ${C_INDEX_CARDINALITY} too many docs`)
        indexEfficiency = C_INDEX_CARDINALITY /* Basically 10X the ammount of work but can use index */
        fetchEfficiency = C_INDEX_CARDINALITY /* Have to fetch more */
        if (indexedFields === nQueryFields) {
          /* Unexpectedly good as we have more index reads but no extra doc reads */
          logExplain(`Index has fields but not at start, looking at ${C_INDEX_CARDINALITY} to many keys `)
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

    // How does fetch efficieny suffer with cache misses - if we have a cache miss ration of 5
    // we add on 5-1 Xthe read overhead cost
    fetchEfficiency = fetchEfficiency + ((constraints.cacheMissRatio - 1) * C_CACHE_MISS_FETCH_COST)

    if (indexEfficiency > 0) {
      // We use an Index
      // 'efficiency' Index Lookup per Document (Multiplied by number of docs we are fetching)
      costPerOp = C_MEM_INDEXFETCH * numRecsRequiredForResult * indexEfficiency

      if (!covered) {
        // console.log('Query is indexed but not covered')

        costPerOp += C_MEM_DOCFETCH * numRecsRequiredForResult * fetchEfficiency
      } else {
        logExplain('Index covers Query - no doc reads')
      }
      // TODO - Tune these
      cpu = 80
      iops = 2
      ram = 10

      if (constraints.cacheMissRatio > 1) {
        iops = 30 * constraints.cacheMissRatio // Read into cache costs
        if (iops > 99) iops = 99
        ram = 100 // Cache full
      }
    } else {
      /* No index == collection scan , assume 100% disk based too */

      // Collection scan will hurt and working set won't count
      cpu = 99
      iops = 99 // Change if whole DB in cache?
      if (constraints.cacheMissRatio === 1 && constraints.level.workingSet === 100) {
        iops = 2
      }
      ram = 99

      logExplain('No Index matched  Query - Collection Scan')
      // A collection scan will scan only what it needs
      // But for now we are assuming every query is fetching all matching docs
      // based on limit - so actaully a limit of 1 will scan half the DB, a limit of
      // 100 will scan the whole DB - either way its' slow

      // We should also correct for the fact we correct for limit later
      // Linear scan is a little more effieicnt than random fetches.
      costPerOp = (C_COLLECTION_SIZE * C_MEM_DOCFETCH) / C_MEM_COLLSCAN_BONUS

      if (numRecsRequiredForResult === 1) {
        costPerOp = costPerOp / 2 // If its unique scan only half on average
      }

      // TODO - Make this 100% disk use and high CPU
    }
    // console.log(costPerOp)

    // If it's less than we have partial indexing˘
    if (costPerOp <= bestCostPerOp) {
      bestCostPerOp = costPerOp
    }
  }

  // We need to take into account limit here - we multiplied the number of ops by limit
  // however fetching 100 documents is realistically not  100x slower then fetching 1
  // Especially if we ignore network latency
  // Going to go with log10(n) - 10x twice as long 100x 3x as long
  logExplain(`costperop ${bestCostPerOp}`)
  // bestCostPerOp = Math.floor((bestCostPerOp / limit) * Math.log10(limit))
  // logExplain(`limit multiplier applied  ${bestCostPerOp}`)

  bestCostPerOp += C_FIXED_CALL_COSTS
  return { cost: bestCostPerOp, cpu, ram, iops }
}
