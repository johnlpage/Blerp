
function tutorialLevels (levelList) {
  const tutorialone = {
    _id: 'tutorial_1',
    intro: [{
      msg: `In this game you construct MongoDB schemas to meet business needs.<p>
        First we will just walk through the controls so you can see how to build things.
        You are presented with a set of fields you can drag into collections.<p> Every collection has a field called _id
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
      msg: `OK, we are ready for out first real challenge, let\'s start with something simple
     - we need to be able to fetch our customers details by CustomerId. We have tens of thousands of customers.`
    },
    {
      msg: `The business estimates we need to fetch 3800 records per second at peak, and we are running on an 
     Atlas M10 hosted instance - which has 1 CPU , 2GB RAM and a reasonably fast disk. `
    }],
    fields: ['_id: ObjectId()', 'CustomerId', 'CustomerDetails'],
    tests: [{ op: 'find', query: { CustomerId: 1 }, limit: 1, project: { CustomerDetails: 1, CustomerId: 1 }, target: 3800, vrange: 5000 }],
    congrats: "Well done, by putting the CustomerId in the Id field it's much faster to retrieve as it has an index."
  }
  levelList.push(beginner1)

  const indexdev = {
    _id: 'indexdev',
    intro: [],
    fields: ['_id: ObjectId()', 'CustomerId', 'CustomerPhone', 'CustomerDetails'],
    tests: [{ op: 'find', query: { CustomerId: 1 }, limit: 1, project: { CustomerDetails: 1, CustomerId: 1 }, target: 3800, vrange: 5000 }],
    flag: "indexes"
  }
  levelList.push(indexdev)

  const beginner2 = {
    _id: 'beginner_2',
    intro: [{
      msg: 'Now we have new requirement, we need to be able to get Customer Details by CustomerId but also by their Phone number.'
    },
    {
      msg: 'We could have two collections and the customer details in both using different values for _id but then we would be storing all the same data twice, which isnt sensible.'
    },
    { msg: 'What we can do is create an additional index on the phone number field, this will make writing a little slower but reading much much faster.' }
   ],
    fields: ['_id: ObjectId()', 'CustomerId', 'CustomerDetails'],
    tests: [{ op: 'find', query: { CustomerId: 1 }, limit: 1, project: { CustomerDetails: 1, CustomerId: 1 }, target: 3800, vrange: 5000 }],
    congrats: "Well done, by putting the CustomerId in the Id field it's much faster to retrieve as it has an index."
  }
  levelList.push(beginner2)
}

// eslint-disable-next-line no-unused-vars
function createLevels (levelList) {
  tutorialLevels(levelList)
  testLevels(levelList)
}
