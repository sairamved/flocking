// Polls goodservice.io for upcoming subway trains at four nearby stations.
// `allTrainETAs` is the live, sorted list other modules read from to decide
// when to trigger a flock takeoff.

let allTrainETAs = [];

function formatTimeDiff(seconds) {
  if (seconds < 0) return 'Departed';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

function getStationName(stopId) {
  switch (stopId) {
    case 'D03': return 'Rockefeller Ctr';
    case 'D43': return 'Coney Island';
    default: return stopId;
  }
}

// Map raw goodservice.io trains for a given (station, direction) into the
// shape we use everywhere else. Returns both the full data and a slimmed-down
// version suitable for console logging (only trains within 10 minutes).
function processTrains(trains, stationName, direction) {
  const now = Math.floor(Date.now() / 1000);
  const trainData = [];
  const logData = [];

  trains.forEach((train) => {
    if (!train.estimated_current_stop_arrival_time) return;
    const etaSeconds = train.estimated_current_stop_arrival_time - now;
    const etaFormatted = formatTimeDiff(etaSeconds);

    if (etaSeconds <= 600) {
      logData.push({ route: train.route_id, direction, station: stationName, eta: etaFormatted });
    }

    trainData.push({
      id: train.id,
      station: stationName,
      direction,
      route: train.route_id,
      destination: getStationName(train.destination_stop),
      etaSeconds,
      etaFormatted,
      fullData: train,
    });
  });

  return { trainData, logData };
}

// Fetch one feed and merge it into the in-progress lists. `directionFilter`
// limits to 'north' or 'south'; `routeFilter` keeps only specific lines.
async function fetchAndMerge(url, station, directionFilter, routeFilter, allData, logData) {
  const response = await fetch(url);
  const data = await response.json();
  const trains = data.upcoming_trips?.[directionFilter];
  if (!trains) return;

  const filtered = routeFilter ? trains.filter((t) => routeFilter.includes(t.route_id)) : trains;
  const { trainData, logData: logSlice } = processTrains(filtered, station, directionFilter);
  allData.push(...trainData);
  logData.push(...logSlice);
}

async function updateAllTimings() {
  try {
    const allData = [];
    const logData = [];

    await fetchAndMerge(config.mta.apis.grandSt, 'Grand St', 'north', null, allData, logData);
    await fetchAndMerge(config.mta.apis.canalSt, 'Canal St', 'north', null, allData, logData);
    await fetchAndMerge(config.mta.apis.dekalbAv, 'Dekalb Av', 'south', ['B', 'D', 'Q'], allData, logData);
    await fetchAndMerge(config.mta.apis.atlanticAv, 'Atlantic Av', 'south', ['D', 'N'], allData, logData);

    allData.sort((a, b) => a.etaSeconds - b.etaSeconds);
    allTrainETAs = allData;
    console.log({ trains: logData });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Find the first upcoming train whose ETA falls inside its trigger window.
// Used by the draw loop to decide whether this frame should launch a flock.
function findTriggeringTrain() {
  return allTrainETAs.find((train) => {
    const window = config.mta.triggerWindows[`${train.route}_${train.direction}`];
    return window && train.etaSeconds <= window.max && train.etaSeconds > window.min;
  });
}

function startMtaPolling() {
  updateAllTimings();
  setInterval(updateAllTimings, config.mta.pollIntervalMs);
}
