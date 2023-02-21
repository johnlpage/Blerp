Live at:

https://johnlpage.github.io/Blerp/

Challenges
-----------


TODO List
----------

~~~Calculating for answer using arrays~~~
Compute Cost of Writes
~~Include Costs of Cache misses~~
Add support for $lookup or client JOIN conceptually

Limited Arrays GUI
  - How to define an array as 'cache'
  - How to account for a 'cached' query (some percentage)
  - Account for multi location writes

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

