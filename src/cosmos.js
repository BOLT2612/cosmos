const { init: initShuttleDb } = require('./dbs/shuttle')
const createSpaceTravelEmitter = require('./private/space-travel-emitter')
const log = require('./logger')
const shuttleUtil = require('./util/shuttle')
const cadet = require('./cadet')

const listen = async () => {
  const shuttleDb = await initShuttleDb()
  const spaceTravelEmitter = createSpaceTravelEmitter()
  let totalCrewCount = 0
  spaceTravelEmitter.on('space-request', evt => {
    log('space-request', evt)
    ++totalCrewCount
    onSpaceTravelRequested({ shuttleDb, ...evt })
  })
  spaceTravelEmitter.on('end', async evt => {
    shuttleUtil.validateShuttles({
      shuttleMap: await shuttleDb.read(),
      crewCount: totalCrewCount
    })
    log(
      [
        'no more space requests, exiting.',
        `db can be viewed: ${shuttleDb.getDbFilename()}`
      ].join(' ')
      )
    })
  }
  
  // [
  //'{"date":10,"name":"discovery","crew":[],"remainingCapacity":1}',
  //    '{"date":3,"name":"sputnik-2","crew":[],"remainingCapacity":3}',
  //    '{"date":-5,"name":"tom-hanks","crew":[],"remainingCapacity":0}'
  // ]
  const onSpaceTravelRequested = async ({ shuttleDb, cosmonautId }) => {
    const shuttles = await shuttleDb.read()
    // console.log(shuttles)
    const availableShuttleData = Object.values(shuttles);
    console.log("availableShuttleData", availableShuttleData);

   const availableShuttleParsed = availableShuttleData.map(x => {
    if (typeof x === "string") return JSON.parse(x);
    else return x;
   });
   console.log(availableShuttleParsed)
    const availableShuttle = availableShuttleParsed
    .find(({ date, remainingCapacity }) => {

      if (date >= 0 && remainingCapacity > 0) return true;
      else return false;
    })
    if (!availableShuttle) {
      throw new Error(
        `unable to schedule cosmonautId ${cosmonautId}, no shuttles available`
        )
      }
      log(
        `found shuttle for cosmonautId ${cosmonautId}, shuttle ${
          availableShuttle.name
        }`
        )
        --availableShuttle.remainingCapacity
        availableShuttle.crew.push(cosmonautId)
        await shuttleDb.write(availableShuttle.name, availableShuttle)
        await cadet.logWelcomeLetter({ cosmonautId, shuttle: availableShuttle })
      }
      
      module.exports = {
        listen
      }
      