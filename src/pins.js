import fs from 'fs';

const debug = require('debug')('rx-rpi-gpio');

var PINS = {
  v1: {
    // 1: 3.3v
    // 2: 5v
    '3':  0,
    // 4: 5v
    '5':  1,
    // 6: ground
    '7':  4,
    '8':  14,
    // 9: ground
    '10': 15,
    '11': 17,
    '12': 18,
    '13': 21,
    // 14: ground
    '15': 22,
    '16': 23,
    // 17: 3.3v
    '18': 24,
    '19': 10,
    // 20: ground
    '21': 9,
    '22': 25,
    '23': 11,
    '24': 8,
    // 25: ground
    '26': 7
  },
  v2: {
    // 1: 3.3v
    // 2: 5v
    '3':  2,
    // 4: 5v
    '5':  3,
    // 6: ground
    '7':  4,
    '8':  14,
    // 9: ground
    '10': 15,
    '11': 17,
    '12': 18,
    '13': 27,
    // 14: ground
    '15': 22,
    '16': 23,
    // 17: 3.3v
    '18': 24,
    '19': 10,
    // 20: ground
    '21': 9,
    '22': 25,
    '23': 11,
    '24': 8,
    // 25: ground
    '26': 7,

    // Model B+ pins
    // 27: ID_SD
    // 28: ID_SC
    '29': 5,
    // 30: ground
    '31': 6,
    '32': 12,
    '33': 13,
    // 34: ground
    '35': 19,
    '36': 16,
    '37': 26,
    '38': 20,
    // 39: ground
    '40': 21
  }
};

var getPinForCurrentMode = getPinRpi;
var currentPins;


const MODE_RPI = 'mode_rpi';
const MODE_BCM = 'mode_bcm';

function getPin(channel) {
  return getPinForCurrentMode(channel);
}

/**
 * Set pin reference mode. Defaults to 'mode_rpi'.
 *
 * @param {string} mode Pin reference mode, 'mode_rpi' or 'mode_bcm'
 */
function setMode(mode) {
  if (mode === MODE_RPI) {
    getPinForCurrentMode = getPinRpi;
  } else if (mode === MODE_BCM) {
    getPinForCurrentMode = getPinBcm;
  } else {
    throw new Error('Cannot set invalid mode');
  }
}

export default { MODE_BCM, MODE_RPI, setMode, getPin };

function init() {
  let data = fs.readFileSync('/proc/cpuinfo', 'utf8');
  // Match the last 4 digits of the number following "Revision:"
  var match = data.match(/Revision\s*:\s*[0-9a-f]*([0-9a-f]{4})/);
  var revisionNumber = parseInt(match[1], 16);
  var pinVersion = (revisionNumber < 4) ? 'v1' : 'v2';

  debug(
      'seen hardware revision %d; using pin mode %s',
      revisionNumber,
      pinVersion
  );

  currentPins = PINS[pinVersion];
}

function getPinRpi(channel) {
  if (currentPins == null) {
    init();
  }
  return currentPins[channel] + '';
}

function getPinBcm(channel) {
  channel = parseInt(channel, 10);
  return [
    3,
    5,
    7,
    8,
    10,
    11,
    12,
    13,
    15,
    16,
    18,
    19,
    21,
    22,
    23,
    24,
    26,
    29,
    31,
    32,
    33,
    35,
    36,
    37,
    38,
    40
  ].indexOf(channel) !== -1 ? (channel + '') : null;
}


