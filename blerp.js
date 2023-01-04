let dragOffsetX, dragOffsetY
let tempElement, tempX, tempY
const collections = []
let fields = []
let elno = 1000

const levels = []
let currentLevel = 0
let dialogBackground
let idElement

function createLevels () {
  const tutorialone = {
    prompts: [{
      x: 5, y: 40, w: 90, h: 90, msg: `In this game you construct MongoDB schemas to meet performance targets.</p>
      You are presented with a set of fields you can drag into collections. Each collection must have a field called _id
      which is the unique identifier for each document`
    }, {
      x: 5, y: 40, w: 90, h: 90, msg: 'By default MongoDB will set the value of the _id field for you as type ObjectId(). This a globally unique auto generated identifier.'
    },
    { x: 5, y: 40, w: 90, h: 90, msg: 'Drag the _id field to the space blow then click Test Schema' }],
    fields: ['_id:ObjectId()']
  }

  levels.push(tutorialone)

  const tutorialtwo = {
    prompts: [{ x: 5, y: 40, w: 90, h: 90, msg: 'The _id field value is unique and always has an index to make it fast to retrieve by.' },
      { x: 5, y: 40, w: 90, h: 12, msg: 'Instead of a random ObjectId() we can store our own unique keys in _id' },
      { x: 5, y: 40, w: 90, h: 12, msg: 'Drag the _id field below then drag CustomerId on top to make a collection where CustomerId is the unique identifier then click "Test Schema"' }
    ],
    fields: ['_id: ObjectId()', 'CustomerID']
  }
  levels.push(tutorialtwo)

  const tutorialthree = {
    prompts: [{ x: 5, y: 40, w: 90, h: 90, msg: 'A collection with only primary key is seldom useful, lets create a colection with multiple fields.' },
      { x: 5, y: 40, w: 90, h: 12, msg: 'Drag the _id field down then the other fields underneath it one at a time to create a collection with multiple fields' }],
    fields: ['_id: ObjectId()', 'CustomerId', 'Name', 'PhoneNumber']
  }
  levels.push(tutorialthree)

  const tutorialfour = {
    prompts: [{ x: 5, y: 40, w: 90, h: 90, msg: 'We can create multiple collections to model our data, Just drag _id down again to start a second colleciton' },
      { x: 5, y: 40, w: 90, h: 12, msg: 'A Customer may have muliple phone numbers, create two collections one for the customer and one for their phone numbers' },
      { x: 5, y: 40, w: 90, h: 12, msg: 'If both contain CustomerId then we will be able to fetch all details for a given customer' }],
    fields: ['_id: ObjectId()', 'CustomerId', 'Name', 'PhoneNumber']
  }
  levels.push(tutorialfour)

  const tutorialfive = {
    prompts: [{
      x: 5, y: 40, w: 90, h: 90, msg: 'Modeling a one to many relationship Customer->Phone like this means reading data from multiple places.'
    },
    { x: 5, y: 40, w: 90, h: 12, msg: 'This is less efficient both when reading and as a developer understanding the model' },
    { x: 5, y: 40, w: 90, h: 12, msg: 'Document databases allow you to store multiple related values for the same field inside the same record' },
    { x: 5, y: 40, w: 90, h: 12, msg: 'Drag Name and PhoneNUmber into the same colleciton, then Drag Phone NUmber again on top of itself to create an Array of numbers' }],
    fields: ['_id: ObjectId()', 'CustomerId', 'Name', 'PhoneNumber']
  }
  levels.push(tutorialfive)
}

// Brings up a popup you must dismiss to continue
// We need to make these dialogs
function messageBubble (prompt, cb) {
  const { x, y, w, h, msg } = prompt
  const newMsg = document.createElement('div')
  newMsg.innerHTML = msg
  newMsg.className = 'messagebubble'
  newMsg.style.top = y + 'vh'
  newMsg.style.left = x + 'vw'
  newMsg.style.width = `calc(${w}vw - 2em)`
  // newMsg.style.height = `calc(${h}vh - 2em)`
  const closeButton = document.createElement('div')
  closeButton.className = 'deletebutton'
  closeButton.append(document.createTextNode('X'))
  closeButton.addEventListener('click', (ev) => { closeMessage(ev, cb) })
  newMsg.append(closeButton)
  dialogBackground = document.createElement('div')
  dialogBackground.className = 'dialogbackground'
  document.body.appendChild(dialogBackground)
  document.body.appendChild(newMsg)
}

// eslint-disable-next-line no-unused-vars
function testSchema () {
  // TODO - Check if level passed
  messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: 'Well Done (p.s. It\'s not actually checking yet)' }, nextLevel)
}

function nextLevel () {
  clearSchema()
  currentLevel++
  for (let i = 0; i < fields.length; i++) {
    fields[i].remove()
  }
  fields = []
  startLevel(levels[currentLevel])
}

// eslint-disable-next-line no-unused-vars
function clearSchema () {
  console.log('clear')
  // Reverse so things dont move
  for (let idx = collections.length; idx > 0; idx--) {
    deleteField(collections[idx - 1].id)
  }
  console.log(JSON.stringify(collections, null, 2))
}

function closeMessage (ev, cb) {
  ev.target.parentElement.remove()
  dialogBackground.remove()
  if (cb) { cb() }
  // tutorial(levels[currentLevel])
}

function tutorial (level) {
  if (level.prompt === undefined) { level.prompt = 0 };
  if (level.prompt >= level.prompts.length) { return }
  messageBubble(level.prompts[level.prompt], () => { tutorial(level) })
  level.prompt = level.prompt + 1
}

function startLevel (level) {
  let x = 10

  for (const label of level.fields) {
    const newEl = newElement(x, 10, label, true)
    if (label === level.fields[0]) newEl.draggable = true
    x = x + newEl.clientWidth + 10
    fields.push(newEl)
  }
  idElement = fields[0]
  tutorial(level)
}

// eslint-disable-next-line no-unused-vars
function onLoad () {
  createLevels()
  startLevel(levels[currentLevel])
  document.addEventListener('dragover', function (e) { e.preventDefault() })
}

function dragEnd (dropX, dropY, text, isId) {
  // We can drop _id anywhere, others only on an existing schema
  if (isId) {
    const el = newElement(dropX, dropY, text, false, true)
    collections.push({ id: el.id, cX: dropX, cY: dropY, arrays: [], fields: ['_id'], elements: [el.id] })
    collections.sort((a, b) => { return b.cY - a.cY })
    // Make everything draggable now
    for (const f of fields) { f.draggable = true };
  } else {
    console.log('Not ID')
    // Can only drop a non _id field under a collection
    for (const collection of collections) {
      const idX = collection.cX
      const idY = collection.cY

      const fieldHeight = document.getElementById(collection.id).clientHeight
      // TODO - adjust these drop target areas
      if (idY + fieldHeight < dropY && dropX > idX - 20 && dropX < idX + 200) {
        dropX = idX
        dropY = idY + (fieldHeight * collection.fields.length)
        if (collection.fields.includes(text) === false) {
          collection.fields.push(text)
          const fieldEl = newElement(dropX, dropY, text, false, true)
          collection.elements.push(fieldEl.id)
        } else {
          // Dropping twice makes this an array
          console.log('Make Array')
          if (collection.arrays.includes(text) === false) {
            collection.arrays.push(text)
            // Update the element to show it's an array
            const idx = collection.fields.indexOf(text)
            const fnameel = document.getElementById(collection.elements[idx])
            fnameel.childNodes[1].textContent = `Array(${text})`
          }
        }
        break
      }
      // Dropping ON _id
      if (idY < dropY < idY + fieldHeight && dropX > idX - 20 && dropX < idX + 80) {
        console.log('On')
        if (collection.fields.includes(text) === false) {
          collection.fields[0] = text
          console.log(document.getElementById(collection.id))
          document.getElementById(collection.id).childNodes[1].textContent = `_id: ${text}`
        }
      }
    }
  }
  console.log(JSON.stringify(collections, null, 2))
}
// eslint-disable-next-line no-unused-vars
function browserDragStart (ev) {
  dragOffsetX = ev.offsetX
  dragOffsetY = ev.offsetY
}

// eslint-disable-next-line no-unused-vars
function browserDragEnd (ev) {
  if (ev.clientY - dragOffsetY < 100) {
    return
  }
  const text = ev.target.childNodes[0].data
  const dropX = ev.clientX - dragOffsetX
  const dropY = ev.clientY - dragOffsetY
  const isId = (ev.target === idElement)

  dragEnd(dropX, dropY, text, isId)
}

// eslint-disable-next-line no-unused-vars
function mobileDragStart (ev) {
// Use draggable to determine if we do this
  if (ev.target.draggable === false) return
  console.log('start')
  // We need to show something being dragged
  // So we add the new element we will ultimately have
  const text = ev.target.childNodes[0].data
  tempElement = newElement(ev.target.offsetLeft, ev.target.offsetTop, text, false, false)
  console.log(tempElement)
}

// eslint-disable-next-line no-unused-vars
function mobileDragEnd (ev) {
  if (ev.target.draggable === false) return

  if (tempElement === undefined) {
    return // Should not happen
  }

  // If we haven't dragged far enough or to the right place
  // Delete the element
  tempElement.remove()

  if (tempY < 100) {
    return
  }
  const text = ev.target.childNodes[0].data
  const isId = (ev.target === idElement)
  dragEnd(tempX, tempY, text, isId)
}

function mobileDrag (ev) {
  if (tempElement === undefined) {
    return // Not Dragging
  }
  if (ev.target.draggable === false) return
  const touchLocation = ev.targetTouches[0]
  // assign box new coordinates based on the touch.
  tempX = touchLocation.pageX
  tempY = touchLocation.pageY
  tempElement.style.left = `${tempX}px`
  tempElement.style.top = `${tempY}px`
}

function deleteBoardItem (ev) {
  const fieldId = ev.target.parentElement.id
  console.log(fieldId)
  return deleteField(fieldId)
}

function deleteField (fieldId) {
  // Check if we are deleting a whole collection

  for (let idx = 0; idx < collections.length; idx++) {
    if (collections[idx].id === fieldId) {
      for (const element of collections[idx].elements) {
        document.getElementById(element).remove()
      }
      // Remove the collection from the list
      collections.splice(idx, 1)

      // If we have emptied list remove drag on non _id
      if (collections.length === 0) {
        for (const f of fields) { if (f !== idElement) { f.draggable = false } }
      }
      console.log(JSON.stringify(collections, null, 2))
      return
    }
    // Is this field part of the collection, if so remove it and shuffle things up
    if (collections[idx].elements.includes(fieldId)) {
      const elidx = collections[idx].elements.indexOf(fieldId)
      collections[idx].elements.splice(elidx, 1)
      collections[idx].fields.splice(elidx, 1)
      const elToRemove = document.getElementById(fieldId)
      const height = elToRemove.clientHeight
      elToRemove.remove()
      // Shuffle the elements below up
      for (let e = elidx; e < collections[idx].elements.length; e++) {
        console.log(collections[idx].elements[e])
        const elToMove = document.getElementById(collections[idx].elements[e])
        elToMove.style.top = (elToMove.style.top.replace('px', '') - height) + 'px'
      }
      console.log(collections[idx])
    }
  }
}

function newElement (x, y, label, inPallette, dropped) {
  const newField = document.createElement('div')
  const labelText = document.createTextNode(label)
  const deleteButton = document.createElement('div')

  elno++
  newField.id = `fid${elno}`

  if (dropped) {
    deleteButton.className = 'deletebutton'
    deleteButton.append(document.createTextNode('X'))
    deleteButton.addEventListener('click', deleteBoardItem)
    newField.append(deleteButton)
  }

  newField.append(labelText)

  if (dropped) {
    newField.className = 'board_field'
    newField.style.left = `${x}px`
    newField.style.top = `${y}px`
    const game = document.getElementById('game')
    // TODO - Wrapper for a collection maybe
    game.appendChild(newField)
  } else {
    newField.className = 'pallette_field'
  }

  if (inPallette) {
    const pallette = document.getElementById('pallette')
    pallette.appendChild(newField)
    addDragListeners(newField)
  }
  // Fake Drag for touch events
  if (!dropped && !inPallette) {
    const game = document.getElementById('game')
    newField.className = 'board_field'
    newField.draggable = true
    game.appendChild(newField)
  }

  return newField
}

// Palette to Board drag
function addDragListeners (newField) {
  newField.addEventListener('dragend', browserDragEnd)
  newField.addEventListener('dragstart', browserDragStart)
  // Mobile Events
  newField.addEventListener('touchstart', mobileDragStart)
  newField.addEventListener('touchmove', mobileDrag)
  newField.addEventListener('touchend', mobileDragEnd)
}
