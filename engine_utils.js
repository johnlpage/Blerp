
const explainPlan = []

// eslint-disable-next-line no-unused-vars
function logExplain (msg) {
  explainPlan.push(JSON.stringify(msg))
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

// eslint-disable-next-line no-unused-vars
function arrayIsSet (array1, array2) {
  // True if Array1 and Array2 have all the same fields
  if (arrayContainsSet(array1, array2) && array1.length === array2.length) {
    return true
  }
  return false
}

/* Given a set of ordered index fields and unordered query fields, how efficiently can you use the index */
/* return 2 values, length of prefix and total number of indexed fields */

// eslint-disable-next-line no-unused-vars
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
