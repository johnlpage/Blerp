I'd like a hand understanding some performance test results. I appreciate there is plenty margin for error in testing and this wasn't the most rigorous but I think these numbers are good, so how do we explain them.

100,000 documents on Atlas each has an average size of 600 bytes or so. Querying by 2 fields (city,state)  (then using aggregation to take the max of a 3rd to avoid network traffic but fetch the documents)

This is all in RAM.

Performance

Collscan ops 24 docs/s (Scans 100K docs so 2.4M docs/s 'read') 
Fully indexed 1040 ops/s (300 keys read & 300 docs read)  312K Keys/s + 312K  Docs/s
Partial Index 150 ops/s ( 5000 keys & 5000 docs) 750 keys/s + 750K docs/s 
Covered 1650 ops/s (300 keys)  495,000 keys/s read ( third field is null BTW)

I'm not understanding the numbers.

How come we can read 2.4M docs per second but only 495,000 keys/s
IF we say that a key read is 4x the cost of a doc read and multiple these into a 'resource cost'

colscan 2.4M
full index 1.5M
part index 3.7M
covered 1.9M

I guess I don't understand why a partial index is so fast versus a full index, or why the covered query
is slow.

Should I take away some fixed overhead from these to make the numbers match up? Basically I want to say how much
does each doc and key read cost

executionStats doesn't help me much either as it just says the stages take 0 or 1 ms