// This function estimates the performanc of the given query using the supplied schrma
// and the constraints object supplied

// This is an implementation of a interesting set of heuristics - see below

/* Calculate a value as to what percentage of operations are a cache miss */
/* This will relate to how much larger the working set is than the cache */
/* It's prety naieve as it assumes all collections are used and all indexes are used */
/* Being out of cache impacts writes as well as reads */

/** ***********
 * Need to work out fixed cost overhead of a call to server
 * Cost fo Index lookup versus retrieval of each match
 * Cost fo FETCH relates to numebr fo records
 * Make collection scam basically fixed
 *
 * *******************/

/* global calcDataSize, explainPlan, exactTest, logExplain, findPerfTest */

// eslint-disable-next-line no-unused-vars
function perfTest (op, collections, level) {
  // console.log('Testing performance')
  // console.log(JSON.stringify(op))

  let opResult
  explainPlan.length = 0

  // This Checks for a specific answer - used in tutorials
  if (op.op === 'exact') {
    return exactTest(op, collections)
  }

  let { totalDataSize, totalIdxSize } = calcDataSize(collections, level)
  // Compute what percentage of cache misses we will have

  if (level.workingSet) {
    totalDataSize = (totalDataSize * level.workingSet) / 100
  }

  const workingDataSize = totalIdxSize + totalDataSize
  console.log(`Full working set is ${workingDataSize}`)
  let cacheMissRatio = 1

  if (level.cacheSize !== undefined) {
    console.log(`Cache size is ${level.cacheSize}`)
    if (workingDataSize > level.cacheSize) {
      cacheMissRatio = workingDataSize / level.cacheSize
      console.log(`Cache Miss Ratio ${cacheMissRatio}`)
    } else {
      console.log('Working set all fits in Cache')
    }
  }
  if (level) {
    if (op.op === 'find') {
      logExplain(op)
      opResult = findPerfTest(op, collections, { cacheMissRatio, level })
      logExplain(opResult)
      if (opResult.possible === false) {
        return { msg: 'It\'s not possible to perform the operations with that schema', ok: false }
      }
    } else {
    // TODO - Add Update/Insert Speed tests

      return { msg: `Operations type ${op.op} is not supported`, ok: false }
    }
  }
  console.log(explainPlan.join('\n'))
  return opResult
}

// What is the cost of writing a document
// This one is super complicated as we may need to update a single document
// Or multiple documents also any indexes

// Cost will be For every collection that contains these fields
// One write op and one write op per index
// Assume no read costs as _id at lest we will imagine to be in RAM
// eslint-disable-next-line no-unused-vars
function insertPerfTest (op, collections, constraints) {

}

// Treat as cost of a find and a write cost for each record found
// Treating writing a large and small doc the same - not strictly ture but OK it not huge

// eslint-disable-next-line no-unused-vars
function updatePerfTest () {

}
