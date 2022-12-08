let dragOffsetX, dragOffsetY
let tempElement, tempX, tempY
const collections = []
const fields = []
let elno = 1000

const levels = []
const currentLevel = 0

const examples = ['_id: ObjectId()', 'Name', 'Number', 'Item', 'Quantity', 'Address']
let idElement

// Brings up a popup you must dismiss to continue

function messageBubble (prompt) {
  const { x, y, w, h, msg } = prompt
  const newMsg = document.createElement('div')
  newMsg.innerHTML = msg
  newMsg.className = 'messagebubble'
  newMsg.style.top = y + 'vh'
  newMsg.style.left = x + 'vw'
  newMsg.style.width = `calc(${w}vw - 2em)`
  newMsg.style.height = `calc(${h}vh - 2em)`
  const closeButton = document.createElement('div')
  closeButton.className = 'deletebutton'
  closeButton.append(document.createTextNode('X'))
  closeButton.addEventListener('click', closeMessage)
  newMsg.append(closeButton)
  document.body.appendChild(newMsg)
}

function closeMessage (ev) {
  ev.target.parentElement.remove()
  tutorial(levels[currentLevel]) // Show next
}

function createLevels () {
  const levelone = {
    prompts: [{
      x: 5, y: 5, w: 90, h: 90, msg: `This is a bunch of text that describes what you have to do</p> 
    In this first level drag the _id field to start a new collection then fields under it.</p>
    If you drag a field onto the _id field you can change what value is used as the unique identifier</p>
    close this message using the button at the top right`
    },
    { x: 10, y: 6, w: 40, h: 12, msg: 'Drag this _id field to the space below to create a new collection' }],
    fields: ['_id: ObjectId()', 'Name', 'Number', 'Item', 'Quantity', 'Address'],
    ops: []
  }
  levels.push(levelone)
}

function tutorial (level) {
  if (level.prompt === undefined) { level.prompt = 0 };
  if (level.prompt >= level.prompts.length) { return }
  messageBubble(level.prompts[level.prompt])
  level.prompt = level.prompt + 1
}

function startLevel (level) {
  let x = 10
  tutorial(level)
  for (const label of level.fields) {
    const newEl = newElement(x, 10, label, true)
    if (label === examples[0]) newEl.draggable = true
    x = x + newEl.clientWidth + 10
    fields.push(newEl)
  }
}

// eslint-disable-next-line no-unused-vars
function onLoad () {
  createLevels()
  startLevel(levels[currentLevel])
  idElement = fields[0]
  document.addEventListener('dragover', function (e) { e.preventDefault() })
}

function dragEnd (dropX, dropY, text, isId) {
  // We can drop _id anywhere, others only on an existing schema
  if (isId) {
    const el = newElement(dropX, dropY, text, false, true)
    collections.push({ id: el.id, cX: dropX, cY: dropY, fields: ['_id'], elements: [el.id] })
    collections.sort((a, b) => { return b.cY - a.cY })
    // Make everything draggable now
    for (const f of fields) { f.draggable = true };
  } else {
    // Can only drop a non _id field under a collection
    for (const collection of collections) {
      const idX = collection.cX
      const idY = collection.cY

      const fieldHeight = document.getElementById(collection.id).clientHeight

      if (idY + fieldHeight < dropY && dropX > idX - 20 && dropX < idX + 80) {
        dropX = idX
        dropY = idY + (fieldHeight * collection.fields.length)
        if (collection.fields.includes(text) === false) {
          collection.fields.push(text)
          const fieldEl = newElement(dropX, dropY, text, false, true)
          collection.elements.push(fieldEl.id)
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
      console.log(elidx)
      for (let e = elidx; e < collections[idx].elements.length; e++) {
        console.log(collections[idx].elements[e])
        const elToMove = document.getElementById(collections[idx].elements[e])
        console.log(height)
        console.log(elToMove)
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
