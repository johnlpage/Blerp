/* global app */

function dragEnd (dropX, dropY, text, isId) {
  // We can drop _id anywhere, others only on an existing schema
  if (isId) {
    app.collections.push({ color: app.colno % app.colours.length, cX: dropX, cY: dropY, arrays: [], fields: [text], indexes: [] })
    app.colno++
    // Make everything draggable now
  } else {
    // Can only drop a non _id field under a collection
    // Iterate in order of ypos
    for (const collection of [...app.collections].sort((a, b) => { return b.cY - a.cY })) {
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
          if (app.flags.arrays) {
            if (collection.arrays.includes(text) === false) {
              collection.arrays.push(text)
            }
          }
        }
        break
      }
      // Dropping ON _id to replace it
      if (app.flags.custom_id && idY < dropY < idY + fieldHeight && dropX > idX - 20 && dropX < idX + 80) {
        if (collection.fields.includes(text) === false) {
          collection.fields[0] = text
        }
      }
    }
  }
}
// eslint-disable-next-line no-unused-vars
function browserDragStart (ev) {
  app.dragOffsetX = ev.offsetX
  app.dragOffsetY = ev.offsetY
  app.selectedIndex = null
}

// eslint-disable-next-line no-unused-vars
function browserDragEnd (ev) {
  if (ev.clientY - app.dragOffsetY < 100) {
    return // Didn't drag it far enough to count
  }

  const text = ev.target.childNodes[0].data
  let dropX = ev.clientX - app.dragOffsetX
  let dropY = ev.clientY - app.dragOffsetY

  // Not outside the board
  const boardEl = document.getElementById('board') /* May change to a board */
  const boardRect = boardEl.getBoundingClientRect()
  const elWidth = ev.target.getBoundingClientRect().width

  dropX = dropX - boardRect.left
  dropY = dropY - boardRect.top

  if (dropX < 1 || dropX > boardRect.width - elWidth) {
    return
  }

  const isId = (ev.target.textContent === app.fields[0])
  // Shift relative to parent

  dragEnd(dropX, dropY, text, isId)
}

// eslint-disable-next-line no-unused-vars
function mobileDragStart (ev) {
  app.selectedIndex = null
  // Use draggable to determine if we do this
  if (ev.target.draggable === false) return

  // We need to show something being dragged
  // So we add the new element we will ultimately have
  const text = ev.target.textContent

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
  const boardEl = document.getElementById('board') /* May change to a board */
  const boardRect = boardEl.getBoundingClientRect()

  app.dragField.visible = false
  // TODO - Check we dragged far enough
  const text = ev.target.textContent
  const isId = (ev.target.textContent === app.fields[0])
  dragEnd(app.dragField.x - boardRect.left, app.dragField.y - boardRect.top, text, isId)
}
