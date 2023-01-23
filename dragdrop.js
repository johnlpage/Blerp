/* global app */

function dragEnd (dropX, dropY, text, isId) {
  // We can drop _id anywhere, others only on an existing schema
  if (isId) {
    // const el = newElement(dropX, dropY, text, false, true)
    app.collections.push({ cX: dropX, cY: dropY, arrays: [], fields: [text] })
    app.collections.sort((a, b) => { return b.cY - a.cY })
    // Make everything draggable now
    // TOVUE - add conditional drag for (const f of fields) { f.draggable = true };
  } else {
    console.log('Not ID')
    // Can only drop a non _id field under a collection
    for (const collection of app.collections) {
      const idX = collection.cX
      const idY = collection.cY
      // Need height to ensure dropping below not on top
      const fieldHeight = document.getElementsByClassName('board_field')[0].clientHeight
      // TODO - adjust these drop target areas
      if (idY + fieldHeight < dropY && dropX > idX - 20 && dropX < idX + 200) {
        dropX = idX
        dropY = idY + (fieldHeight * collection.fields.length)
        if (collection.fields.includes(text) === false) {
          collection.fields.push(text)
        } else {
          // Dropping twice makes this an array
          console.log('Make Array')
          if (collection.arrays.includes(text) === false) {
            collection.arrays.push(text)
            // TOVUE - Show Arrays
          }
        }
        break
      }
      // Dropping ON _id to replace it
      if (idY < dropY < idY + fieldHeight && dropX > idX - 20 && dropX < idX + 80) {
        console.log('On')
        if (collection.fields.includes(text) === false) {
          collection.fields[0] = text
        }
      }
    }
  }
  console.log(JSON.stringify(app.collections, null, 2))
}
// eslint-disable-next-line no-unused-vars
function browserDragStart (ev) {
  app.dragOffsetX = ev.offsetX
  app.dragOffsetY = ev.offsetY
}

// eslint-disable-next-line no-unused-vars
function browserDragEnd (ev) {
  if (ev.clientY - app.dragOffsetY < 100) {
    return // Didn't drag it far enough to count
  }

  const text = ev.target.childNodes[0].data
  const dropX = ev.clientX - app.dragOffsetX
  const dropY = ev.clientY - app.dragOffsetY

  // Not outside the board
  const boardEl = document.getElementById('game') /* May change to a board */
  const boardRect = boardEl.getBoundingClientRect()
  const elWidth = ev.target.getBoundingClientRect().width

  console.log(dropX,boardRect)
  if (dropX < boardRect.left || dropX > boardRect.right - elWidth) {
    return
  }
  console.log(ev.target)
  const isId = (ev.target.textContent === app.fields[0])

  dragEnd(dropX, dropY, text, isId)
}

// eslint-disable-next-line no-unused-vars
function mobileDragStart (ev) {
  // Use draggable to determine if we do this
  if (ev.target.draggable === false) return
  console.log('start')
  // We need to show something being dragged
  // So we add the new element we will ultimately have
  const text = ev.target.textContent
  // tempElement = newElement(ev.target.offsetLeft, ev.target.offsetTop, text, false, false)
  // console.log(tempElement)

  const touchLocation = ev.targetTouches[0]

  const boundingRect = ev.target.getBoundingClientRect()
  app.dragOffsetX = boundingRect.left - touchLocation.pageX
  app.dragOffsetY = boundingRect.top - touchLocation.pageY

  // assign box new coordinates based on the touch.
  app.dragField.x = touchLocation.pageX + app.dragOffsetX
  app.dragField.y = touchLocation.pageY + app.dragOffsetY

  // const touchLocation = ev.targetTouches[0]
  app.dragField.text = text
  app.dragField.visible = true
}

// eslint-disable-next-line no-unused-vars
function mobileDrag (ev) {
  if (app.dragField.visible === false) {
    return // Not Dragging
  }

  const touchLocation = ev.targetTouches[0]
  // assign box new coordinates based on the touch.
  app.dragField.x = touchLocation.pageX + app.dragOffsetX
  app.dragField.y = touchLocation.pageY + app.dragOffsetY
}

// eslint-disable-next-line no-unused-vars
function mobileDragEnd (ev) {
  if (app.dragField.visible === false) {
    return // Not Dragging
  }
  app.dragField.visible = false
  // TODO - Check we dragged far enough
  const text = ev.target.textContent
  const isId = (ev.target.textContent === app.fields[0])
  dragEnd(app.dragField.x, app.dragField.y, text, isId)
}
