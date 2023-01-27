
function tutorialLevels (levelList) {
  const tutorialone = {
    _id: 'tutorial_1',
    intro: [{
      msg: `In this game you construct MongoDB schemas to meet performance targets.<p>
        You are presented with a set of fields you can drag into groups called collections.<p> Every collection has a field called _id
        which is the unique identifier `
    }, { msg: 'By default MongoDB will set the value of the _id field as an instance of an ObjectId. This an auto-generated globally unique value.' },
    { msg: 'Drag the _id field to the space below then click Test Schema to make your first collection' }],
    fields: ['_id: ObjectId()'],
    tests: [{ op: 'exact', collections: [{ fields: ['_id: ObjectId()'] }] }],
    congrats: "Great, now let's try adding multiple fields."
  }

  levelList.push(tutorialone)

  const tutorialthree = {
    _id: 'tutorial_3',
    intro: [{ msg: 'A collection with only a single field is seldom useful.' },
      { msg: 'Drag the _id field down then the other fields <b>below</b> it one at a time to create a collection with all the fields' }],
    fields: ['_id: ObjectId()', 'CustomerId', 'Name', 'PhoneNumber'],
    tests: [{ op: 'exact', collections: [{ fields: ['_id: ObjectId()', 'CustomerId', 'Name', 'PhoneNumber'] }] }]
  }
  levelList.push(tutorialthree)

  const tutorialtwo = {
    _id: 'tutorial_2',
    intro: [{ msg: 'The _id field value is unique and always has an index to make it fast to retrieve by.' },
      { msg: 'Instead of a random ObjectId() we can store our own unique keys in _id.' },
      { msg: 'Drag the _id field below then drag CustomerId <b>on top of it</b> to make a collection where CustomerId is the unique identifier then click "Test Schema"' }
    ],
    fields: ['_id: ObjectId()', 'CustomerID'],
    tests: [{ op: 'exact', collections: [{ fields: ['CustomerID'] }] }],
    flag: 'custom_id'
  }
  levelList.push(tutorialtwo)

  const tutorialfour = {
    _id: 'tutorial_4',
    intro: [{ msg: 'A box could represent a single field, or a group of fields we plan to keep together as here' },
      { msg: 'We can create multiple collections to model our data, Just drag _id down again to start a second colleciton' },
      { msg: 'Create two collections one for Customers and One for orders' },
      { msg: 'Assuming both sets contain a customer identifier then we will be able to fetch all Orders for a given customer' }],
    fields: ['_id: ObjectId()', 'CustomerDetails', 'OrderDetails'],
    tests: [{ op: 'exact', collections: [{ fields: ['_id: ObjectId()', 'CustomerDetails'] }, { fields: ['_id: ObjectId()', 'OrderDetails'] }] }]

  }
  levelList.push(tutorialfour)

  const tutorialfive = {
    _id: 'tutorial_5',
    intro: [{
      msg: `Modeling a one to many relationship like a customer with multiple orders like that means reading data from
       multiple places. This is much less efficient when reading from the database`
    },
    { msg: 'Document databases allow you to store multiple related values for the same field inside the same record' },
    { msg: 'Drag CustomerId, CustomerDetails and OrderDetails into one collection, then drag OrderDetails <b>again</b> on top of itself to create an array of numbers' }],
    fields: ['_id: ObjectId()', 'CustomerId', 'CustomerDetails', 'OrderDetails'],
    tests: [{ op: 'exact', collections: [{ fields: ['_id: ObjectId()', 'CustomerId', 'CustomerDetails', 'OrderDetails'], arrays: ['OrderDetails'] }] }],
    flag: 'arrays'
  }
  levelList.push(tutorialfive)
}

function testLevels (levelList) {
  // Using this to create engine test levels
  const beginner1 = {
    _id: 'beginner_1',
    intro: [{
      msg: 'OK, we are ready for out first real challenge. We need to be able to fetch CustomerDetails using CustomerId. We have approximately 100,000 customers.'
    },
    {
      msg: 'The business estimates we need to fetch 1200 records per second at peak. Our server has 1 CPU and the data is small enough to fit in RAM. '
    }],
    fields: ['_id: ObjectId()', 'CustomerId', 'CustomerDetails'],
    tests: [{
      desc: 'Fetch CustomerDetails by CustomerID',
      op: 'find',
      query: { CustomerId: 1 },
      limit: 1,
      project: { CustomerDetails: 1, CustomerId: 1 },
      target: 1200
    }],
    congrats: "Well done, by putting the CustomerId in the _id field it's much faster to retrieve as that has an index."
  }
  levelList.push(beginner1)

  const indexdev = {
    _id: 'indexdev',
    intro: [{ msg: 'Now we need to be able to get CustomerDetails by CustomerId but also by their Phone number.' },
      { msg: 'We could have two collections and the customer details in both using different values for _id but storing the same data twice is wasteful.' },
      { msg: 'Create an additional index on the phone number field to make that fast to retrieve too.' },
      { msg: 'To add an index just click on the field once you have added it to a collection.' }
    ],
    fields: ['_id: ObjectId()', 'CustomerId', 'CustomerPhone', 'CustomerDetails'],
    tests: [{
      op: 'find',
      desc: 'Fetch Customer details by Id',
      query: { CustomerId: 1 },
      limit: 1,
      project: {
        CustomerDetails: 1,
        CustomerId: 1
      },
      target: 1200
    },
    {
      op: 'find',
      desc: 'Fetch Customer details by Phone no.',
      query: { CustomerPhone: 1 },
      limit: 1,
      project: {
        CustomerDetails: 1,
        CustomerId: 1,
        CustomerPhone: 1
      },
      target: 1200
    }],
    congrats: 'Well done, by having an index on both CutomerId and CustomerPhone we can fetch data quickly.',
    flag: 'index'
  }
  levelList.push(indexdev)

  const compounddev = {
    _id: 'compoundindex',
    intro: [{ msg: 'If you have multiple conditions in your query, you need an index that includes both of them. This is called a Compound Index.' },
      { msg: 'You can add fields to an existing index by clicking on the index, then the fields to add.' },
      { msg: 'We\'ve decided we want to fetch details of all customers  by City and State so create an index for that' },
      { msg: 'Try to get it so we can fetch the list of customers at a rate of 500 calls per second' }
    ],
    fields: ['_id: ObjectId()', 'City', 'State', 'CustomerDetails'],
    tests: [{
      op: 'find',
      desc: 'Fetch Customer details by City and State',
      query: { City: 1, State: 1 },
      limit: 100,
      project: {
        CustomerDetails: 1
      },
      target: 500
    }],
    flag: 'compound'
  }

  levelList.push(compounddev)

  const compoundindexmulti = {
    _id: 'compoundindexmulti',

    intro: [{ msg: 'An index can only be used if the first field in the index is in the query.' },
      { msg: 'Create indexes so we can query by city, state or both at at least 500 per second.' }],
    fields: ['_id: ObjectId()', 'City', 'State', 'CustomerDetails'],
    tests: [{
      op: 'find',
      desc: 'Fetch Customer details by City and State',
      query: { City: 1, State: 1 },
      limit: 100,
      project: {
        CustomerDetails: 1
      },
      target: 500,
      flag: 'compound'
    },
    {
      op: 'find',
      desc: 'Fetch Customer details  State',
      query: { State: 1 },
      limit: 100,
      project: {
        CustomerDetails: 1
      },
      target: 500
    },
    {
      op: 'find',
      desc: 'Fetch Customer details by City ',
      query: { City: 1 },
      limit: 100,
      project: {
        CustomerDetails: 1
      },
      target: 500

    }],
    flag: 'compound'
  }

  levelList.push(compoundindexmulti)

  const covered1 = {
    _id: 'covered1',
    intro: [{ msg: 'If an index contains both the query fields and those we are retrieving then we can complete the operation without fetching the documents' },
      { msg: 'This is called a Covered Query and can be considerably faster but can make your indexes larger needing more hardware ' },
      { msg: 'Create a covering index to allow us to fetch CustomerDetails by City and State at over 700 ops per second' }
    ],
    fields: ['_id: ObjectId()', 'City', 'State', 'CustomerDetails'],
    cachesize: 100, /* Quantuty of available cache */
    ndocs: 100, /* Number of docs in working set */
    tests: [{
      op: 'find',
      desc: 'Fetch Customer details by City and State',
      query: { City: 1, State: 1 },
      limit: 101, /* How many to retrieve */
      project: {
        CustomerDetails: 1
      },
      target: 700 /* Required Speed */
    }]
  }

  levelList.push(covered1)
}

// eslint-disable-next-line no-unused-vars
function createLevels (levelList) {
  tutorialLevels(levelList)
  testLevels(levelList)
}
