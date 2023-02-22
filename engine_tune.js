/* eslint-disable no-unused-vars */
/* Constants to tune the simulator */

const C_OPS_PERCPU = 600000 /* Typical number of opsCost points a single CPU can do */
const C_MEM_INDEXFETCH = 4 /* 1 Time unit to fetch from an index entry in memory */
const C_MEM_DOCFETCH = 2 /* Time to fetch a document from cache */
const C_MEM_COLLSCAN_BONUS = 4.5 /* Need to incorporate DB size, assume 10000 for */
const C_INDEX_CARDINALITY = 7 /* { a:1, b:1 } - ave number of b per value of a */
const C_FIXED_CALL_COSTS = 400
const C_CACHE_MISS_FETCH_COST = 40
const C_FIELD_SIZE = 1 /* Represents one field sized unit :-) */
