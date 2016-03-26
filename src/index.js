import { Observable } from 'rx';
import { Gpio } from 'onoff';
import Pins from 'pins';

const debug = require('debug')('rx-rpi-gpio');

/**
 * sets the given channel to the provided direction/edge, and reports any change to the returned observable<0|1>
 */
export function rxWatch(channel, direction, edge) {
  return Observable.concat(Pins.init(), Observable.create((observer) => {
    let io = new Gpio(Pins.getPin(channel), direction, edge);
    io.watch(function (err, value) {
      if (err) {
        observer.onError(err);
      } else {
        observer.onNext(value);
      }
    });
    return () => io.unexport();
  }));
}

/**
 * sets the giving channel to input and edge detection, and reports the (low) PWM ratio over
 * (at least) the provided period. Based solely on GPIO interrupts (no timer), hence may not
 * behave adequately for signals with a frequency below the sampling time.
 * 
 * @returns an observable<ratio: float>, representing the time ratio (0-100) for which the signal was low
 */
export function rxPulseInLow(channel, sampletime_ms) {
  return rxPulseIn(channel, sampletime_ms, 0);
}

/**
 * sets the giving channel to input and edge detection, and reports the (high) PWM ratio over
 * (at least) the provided period. Based solely on GPIO interrupts (no timer), hence may not
 * behave adequately for signals with a frequency below the sampling time.
 * 
 * @returns an observable<ratio: float>, representing the time ratio (0-100) for which the signal was high
 */
export function rxPulseInHigh(channel, sampletime_ms) {
  return rxPulseIn(channel, sampletime_ms, 1);
}

function rxPulseIn(channel, sampletime_ms, trigger_edge) {
  return Observable.defer(() => {
    let starttime = new Date().getTime();
    let lowpulseoccupancy = 0;
    let start = null;
    return rxWatch(channel, 'in', 'both')
      .distinctUntilChanged()
      .flatMap((value) => {
        let ts = new Date().getTime();
        if (value != trigger_edge)
          start = ts;
        else if (start) {
          let duration = ts-start;
          lowpulseoccupancy += duration;
          if ((ts-starttime) > sampletime_ms) {
            let ratio = 100*lowpulseoccupancy/(ts-starttime);
            lowpulseoccupancy = 0;
            starttime = ts;
            debug(`Detecting low pulse occupancy ratio on channel ${channel}: ${ratio}%`);
            return [{ts: ts, lpo: ratio}];
          }
        }
        return [];
      });
  });
}
