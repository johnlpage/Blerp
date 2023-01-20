let dragOffsetX, dragOffsetY
let tempElement, tempX, tempY
const collections = []
let fields = []
let elno = 1000

const levels = []
let currentLevelNo = 0
let idElement

// Brings up a popup you must dismiss to continue
// We need to make these dialogs
function messageBubble (prompt, cb) {
  let { x, y, w, h, msg } = prompt
  if (x === undefined) x = 5
  if (y === undefined) y = 40
  if (w === undefined) w = 90
  if (h === undefined) h = 12

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
  document.body.appendChild(newMsg)
  document.getElementById('dialogbackground').style.display = 'inline'
}

// eslint-disable-next-line no-unused-vars
async function testSchema () {
  // TODO - Check if level passed
  console.log('Check Schema')
  const { tests } = levels[currentLevelNo]
  for (const test of tests) {
    // eslint-disable-next-line no-undef
    const testOutcome = perfTest(test, collections)
    console.log(testOutcome)
    if (testOutcome.ok === false) {
      /* We cannot use this schema at all */
      messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: testOutcome.msg }, restartLevel)
      return
    } else {
      if (testOutcome.performance > 0) {
      // Show the performance
      // eslint-disable-next-line no-undef
        testOutcome.vrange = test.vrange ? test.vrange : 12000
        await new Promise((resolve) => { simulateOp(testOutcome, resolve) })
        // And fail if we have to
        if (testOutcome.performance < testOutcome.target) {
          messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: 'Sorry but that\'s not fast enough' }, restartLevel)
          return
        }
      }
    }
  }
  localStorage.setItem(levels[currentLevelNo]._id, true)
  let congrats = levels[currentLevelNo].congrats
  if (congrats === undefined) congrats = 'Well Done - that\'s correct'
  messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: congrats }, startNextLevel)
}

// eslint-disable-next-line no-unused-vars
function restartLevel () {
  console.log('restart')
  currentLevelNo--
  startNextLevel()
}

function startNextLevel () {
  clearSchema()
  currentLevelNo++
  for (let i = 0; i < fields.length; i++) {
    fields[i].remove()
  }
  fields = []
  startLevel(levels[currentLevelNo])
}

// eslint-disable-next-line no-unused-vars
function clearSchema () {
  // Reverse so things dont move
  for (let idx = collections.length; idx > 0; idx--) {
    deleteField(collections[idx - 1].id)
  }
  console.log(JSON.stringify(collections, null, 2))
}

function closeMessage (ev, cb) {
  ev.target.parentElement.remove()
  document.getElementById('dialogbackground').style.display = 'none'
  if (cb) { cb() }
}

function showIntro (level) {
  if (level.prompt === undefined) { level.prompt = 0 };
  if (level.prompt >= level.intro.length) { return }
  messageBubble(level.intro[level.prompt], () => { showIntro(level) })
  level.prompt = level.prompt + 1
}

function startLevel (level) {
  let x = 10
  // Skip completed levels
  let levelid = levels[currentLevelNo]._id
  while (localStorage.getItem(levelid)) {
    console.log(`Skipping ${levelid} as alreadly complete`)
    currentLevelNo++
    levelid = levels[currentLevelNo]._id
  }
  level = levels[currentLevelNo]
  console.log(`Starting Level ${currentLevelNo}`)
  for (const label of level.fields) {
    const newEl = newElement(x, 10, label, true)
    if (label === level.fields[0]) newEl.draggable = true
    x = x + newEl.clientWidth + 10
    fields.push(newEl)
  }
  idElement = fields[0]
  level.prompt = 0
  showIntro(level)
}
/* global createLevels */
// eslint-disable-next-line no-unused-vars
function onLoad () {
  createLevels()
  startLevel(levels[currentLevelNo])
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
