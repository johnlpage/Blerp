let dragOffsetX, dragOffsetY
let tempElement, tempX, tempY
const collections = []
const fields = []
let elno = 1000
const examples = ['_id: ObjectId()', 'Name', 'Number']
let idElement

// eslint-disable-next-line no-unused-vars
function onLoad () {
  let x = 10
  for (const label of examples) {
    const newEl = newElement(x, 10, label, label === examples[0])
    x = x + newEl.clientWidth + 10
    fields.push(newEl)
  }
  idElement = fields[0]
  document.addEventListener('dragover', function (e) { e.preventDefault() })
}

function dragEnd (dropX, dropY, text, isId) {
  // We can drop _id anywhere, others only on an existing schema
  if (isId) {
    const el = newElement(dropX, dropY, text)
    collections.push({ id: el.id, cX: dropX, cY: dropY, fields: ['_id'] })
    collections.sort((a, b) => { return b.cY - a.cY })
    // Make everything draggable now
    for (const f of fields) { if (f.draggable === false) { makeDraggable(f) } };
  } else {
    console.log('add to colleciton')
    // Can only drop a non _id field under a collection
    for (const collection of collections) {
      console.log(collection)
      const idX = collection.cX
      const idY = collection.cY
      console.log({ idX, idY, dropX, dropY })
      if (idY < dropY && dropX > idX - 20 && dropX < idX + 80) {
        dropX = idX
        dropY = idY + (45 * collection.fields.length)
        if (collection.fields.includes(text) === false) {
          collection.fields.push(text)
          newElement(dropX, dropY, text)
        }
        break
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
  // We need to show something being dragged
  // So we add the new element we will ultimately have
  const text = ev.target.childNodes[0].data
  tempElement = newElement(ev.target.offsetLeft, ev.target.offsetTop, text, false)
  console.log(tempElement)
}

// eslint-disable-next-line no-unused-vars
function mobileDragEnd (ev) {
  if (tempElement === undefined) {
    return // Should not happen
  }

  // If we haven't dragged far enough or to the right place
  // Delete the element
  if (tempY < 100) {
    tempElement.remove()
    return
  }
  dragEnd(tempX, tempY, text, isId )
}

function mobileDrag (ev) {
  if (tempElement === undefined) {
    return // Not Dragging
  }

  const touchLocation = ev.targetTouches[0]
  // assign box new coordinates based on the touch.
  tempX = touchLocation.pageX
  tempY = touchLocation.pageY
  tempElement.style.left = `${tempX}px`
  tempElement.style.top = `${tempY}px`
}

function newElement (x, y, label, draggable) {
  const newField = document.createElement('div')
  const labelText = document.createTextNode(label)
  newField.append(labelText)
  newField.style.left = `${x}px`
  newField.style.top = `${y}px`
  newField.className = 'field'
  if (draggable) {
    makeDraggable(newField)
  }
  const game = document.getElementById('game')
  elno++
  newField.id = `fid${elno}`
  game.appendChild(newField)
  return newField
}

function makeDraggable (newField) {
  newField.draggable = true
  newField.addEventListener('dragend', browserDragEnd)
  newField.addEventListener('dragstart', browserDragStart)
  // Mobile Events
  newField.addEventListener('touchstart', mobileDragStart)
  newField.addEventListener('touchmove', mobileDrag)
  newField.addEventListener('touchend', mobileDragEnd)
}
