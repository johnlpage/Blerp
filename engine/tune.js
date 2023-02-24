/* eslint-disable no-unused-vars */
/* Constants to tune the simulator */

const C_OPS_PERCPU = 600000 /* Typical number of opsCost points a single CPU can do */
const C_MEM_INDEXFETCH = 4 /* 1 Time unit to fetch from an index entry in memory */
const C_MEM_DOCFETCH = 2 /* Time to fetch a document from cache */
const C_MEM_COLLSCAN_BONUS = 4.5 /* Need to incorporate DB size, assume 10000 for */
/* TODO THe one below is defineable now */
const C_INDEX_CARDINALITY = 7 /* { a:1, b:1 } - ave number of b per value of a */
const C_FIXED_CALL_COSTS = 20 // Network lag matters, probavly dial this down though
const C_CACHE_MISS_FETCH_COST = 40
const C_FIELD_SIZE = 1 /* Represents one field sized unit :-) */
const C_WRITECOST_PER_FIELD = 1 // Additional cost per field
const C_INDEXWRITE = 5 // It's not really that bad but 5 for this and 20 for a docuemtn
const C_DOCWRITE = 19 // Fixed cost per document
const C_COLLECTION_SIZE = 150_000 // Used to estimate cost of COLSCAN