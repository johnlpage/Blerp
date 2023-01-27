Live at:

https://johnlpage.github.io/Blerp/

Challenges
-----------

How do I express a test beyond time to retrieve a single doc, i.e. time to retrieve
all Orders for a Customer where that may not be 1:1 with documents if using Join or Array




TODO List
----------

Correct use of Limit
Calculating for answer using arrays
Writing
Cache impact

~~Rewrite HTML/Render uing Vue.js (Shoudl have done that to start with)~~
~~Add 'Feature Enablement' flags~~
~~Fix 'Mobile Ratio' on browser~~

~~Indexes GUI~~
  ~~Move Index Definition into collection definition!! (Why isn't it)~~

~~BUG: Colours of collections change on delete as due to order~~

N.B - requests per second versus Docs/s ??
Do we talk about network latency??

Using Indexes (Wed)
Covering Indexes (Wed)
  - ~~Perect indexing~~
  - ~~Index Partially matches, requires fetch~~
  - ~~Index matches with extra index lookups~~
  - Working Set / Disk speed

Write speed simulation (Wed)
  - Cost of write (doc + nindexes*0.1)

Hardware constraints (Thur)
  - Compute Data and Index sizes & working set
  - Add read/write costs if WS > RAM
  
Create Good Levels (Fri)
 
 // V1 covers basics of arrays and indexing , not more complex schemas */


Limited Arrays GUI
  - How to define an array as 'cache'
  - How to account for a 'cached' query (some percentage)

Concept of JOINs
  - Ability to satisfy with >1 Collection

Suggestions
------------

Show where drops will happen


Rules/Explainer
-----------------

You see all the fields/groups of fields you need to support (In final levels maybe you have ones you don't need!)
You drag them into collections
You can specify if a field is a scalar or an array where appropriate
You can 'See' the schema
You get a set of operations you need to support
You get a performance figure for that schema and are trying to hit a target
YOuy can use any field as a unique identifer - if it's not unique then it will be postfixed with unique id.
... Need way to describe cardinality/relationships maybe
... That's best as text.




Bugs/Issues
------------
Drop Beneath doesnt go far enough to the right
Move/Drag Collection not supported?
Failure restarts whole level? UX issue

