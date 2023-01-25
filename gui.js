let app
/* global Vue */

// eslint-disable-next-line no-unused-vars
function onLoad () {
  const { createApp } = Vue
  app = createApp({
    // eslint-disable-next-line no-undef
    methods: { closeSim, testSchema, restartLevel, browserDragStart, browserDragEnd, mobileDragStart, mobileDragEnd, mobileDrag, deleteField, closeMessage, addIndex, deleteIndex, selectIndex },
    data () {
      return {
        colno: 0,
        selectedIndex: null,
        colours: ['var(--field-background)', 'var(--collection-two)', 'var(--collection-three)', 'var(--collection-four)', 'var(--collection-five)'],
        collections: [],
        fields: [],
        levels: [],
        indexes: [],
        currentLevel: {},
        currentLevelNo: 0,
        dragOffsetX: 0,
        dragOffsetY: 0,
        dragField: { x: 0, y: 0, text: '', visible: false },
        showDialog: false,
        showMessageBubble: false,
        flags: {},
        messageBubble: { msg: 'No Message', cb: null },
        showSimulator: false,
        simulator: { opdesc: null, data: null, line: null, x: null, graphtime: 0, cpu: 0, ram: 0, disk: 0, ops: 0, target: 0, vrange: 100, resolvefn: () => {} }
      }
    }
  }).mount('#game')

  createLevels(app.levels) /* global createLevels */
  startLevel(app.currentLevelNo)
  document.addEventListener('dragover', function (e) { e.preventDefault() })
}

// Brings up a popup you must dismiss to continue
// We need to make these dialogs
function messageBubble (prompt, cb) {
  let { x, y, w, h, msg } = prompt
  if (x === undefined) x = 5
  if (y === undefined) y = 20
  if (w === undefined) w = 90
  if (h === undefined) h = 12
  app.messageBubble.x = x
  app.messageBubble.y = y
  app.messageBubble.w = w
  app.messageBubble.h = h

  app.messageBubble.msg = msg

  app.messageBubble.cb = cb
  app.showMessageBubble = true
  app.showDialog = true
}

// eslint-disable-next-line no-unused-vars
async function testSchema () {
  // TODO - Check if level passed
  console.log('Check Schema')
  const { tests } = app.currentLevel
  for (const test of tests) {
    // eslint-disable-next-line no-undef
    const testOutcome = perfTest(test, app.collections)
    console.log(testOutcome)
    if (testOutcome.ok === false) {
      /* We cannot use this schema at all */
      messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: testOutcome.msg }, () => {})
      return
    } else {
      if (testOutcome.performance > 0) {
        // Show the performance
        // eslint-disable-next-line no-undef
        testOutcome.vrange = test.vrange ? test.vrange : 12000
        testOutcome.desc = test.desc
        await new Promise((resolve) => { simulateOp(testOutcome, resolve) }) /* global simulateOp */
        // And fail if we have to
        if (testOutcome.performance < testOutcome.target) {
          messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: 'Sorry but that\'s not fast enough' }, () => {})
          return
        }
      }
    }
  }
  localStorage.setItem(app.currentLevel._id, true)
  let congrats = app.currentLevel.congrats
  if (congrats === undefined) congrats = 'Well Done - that\'s correct'
  messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: congrats }, startNextLevel)
}

// eslint-disable-next-line no-unused-vars
function restartLevel () {
  console.log('restart')
  localStorage.removeItem(app.levels[app.currentLevelNo]._id)
  app.currentLevelNo--
  startNextLevel()
}

function startNextLevel () {
  clearSchema()
  app.currentLevelNo++
  app.colno = 0
  startLevel(app.currentLevelNo)
}

// eslint-disable-next-line no-unused-vars
function clearSchema () {
  app.collections = []
  console.log(JSON.stringify(app.collections, null, 2))
}

function closeMessage () {
  app.showMessageBubble = false
  app.showDialog = false
  app.selectedIndex = null
  if (app.messageBubble.cb) { app.messageBubble.cb() }
}

function showIntro (level) {
  if (level.prompt === undefined) { level.prompt = 0 };
  if (level.prompt >= level.intro.length) { return }
  messageBubble(level.intro[level.prompt], () => { showIntro(level) })
  level.prompt = level.prompt + 1
}

function startLevel (levelNo) {
  app.selectedIndex = null

  let level = app.levels[levelNo]

  /* Skip completed levels */
  while (level && localStorage.getItem(level._id)) {
    if (level.flag) {
      app.flags[level.flag] = true
    }
    app.currentLevelNo++
    level = app.levels[app.currentLevelNo]
  }

  if (level === undefined) {
    app.currentLevelNo--
    messageBubble({ msg: 'Retrying last level for development purposes' }, restartLevel)
    // messageBubble({ x: 5, y: 20, w: 90, h: 60, msg: "You have completed all levels, thank's for playing. Go try out the real thing now" }, () => { console.log('Byee'); window.location.replace('http://cloud.mongodb.com') })
    return
  }

  if (level.flag) {
    app.flags[level.flag] = true
  }

  console.log(`Starting Level ${level._id}`)
  app.currentLevel = level
  app.fields = level.fields
  level.prompt = 0
  showIntro(level)
}

function deleteField (collectionidx, fieldidx) {
  app.selectedIndex = null
  if (fieldidx === 0) {
    app.collections.splice(collectionidx, 1)
  } else {
    const fname = app.collections[collectionidx].fields[fieldidx]
    const arrayIdx = app.collections[collectionidx].arrays.indexOf(fname)
    if (arrayIdx !== -1) {
      // Remove it from arrays if it's there too
      app.collections[collectionidx].arrays.splice(arrayIdx, 1)
    }
    app.collections[collectionidx].fields.splice(fieldidx, 1)
  }
}
