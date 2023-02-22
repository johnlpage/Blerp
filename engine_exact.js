/* global arrayIsSet */

// eslint-disable-next-line no-unused-vars
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
