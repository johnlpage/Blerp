Live at:

https://johnlpage.github.io/Blerp/

Challenges
-----------


TODO List
----------

~~~Calculating for answer using arrays~~~

~~Include Costs of Cache misses~~
Compute Cost of Writes
    ~~Insert~~~~
    ~~Upsert (adding via $push or inserting)~~
    Update - changing all existing

Add support for $lookup or client JOIN conceptually (call it aggregate)

Limited Arrays GUI
  - How to define an array as 'cache'
  - How to account for a 'cached' query (some percentage)
  - Account for multi location writes

Document Level Schema

Write a Story for the levels


Suggested Improvements
------------

Show where drops will happen
Improve size of dropzone
Drag Collection option
~~Failure restarts whole level? UX issue~~


Dominics Feedback
--------------

Notes: (Wish I'd commented these now)
Highlight the collection a field would be added to
Level 3 (tutorial_2):
Setting cusstomerId sets the wrong ID -> x location
Deleting the pink ID deleted the green ID
Multiple collections work if at least one of them is correct
Level 4 ():
Exact matches
Level 5:
Turning everything into an array still gets accepted
Level 6 (beginner_1):
Target needs to be reduced to about 2k (or algorithm)
Level 7 (indexdev):
Same algorithm problem
Maybe both in the same graph with different colours
Level 8 (compoundindex):
Compound index doesn’t activate / highlight, new indices get added as a new array
Having CustomerDetails as ID is a performance hit
Levle 9 (covered1):
Triple index not checked
