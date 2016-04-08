import { Observable } from 'rx';
import { Gpio } from 'onoff';

const debug = require('debug')('rx-rpi-gpio');

/**
 * sets the given channel to the provided direction/edge, and reports any change to the returned observable<0|1>
 */
function watch(channel, direction, edge) {
  return Observable.create((observer) => {
    let io = new Gpio(channel, direction, edge);
    io.watch(function (err, value) {
      if (err) {
        observer.onError(err);
      } else {
        observer.onNext(value);
      }
    });
    return () => io.unexport();
  });
}

/**
 * sets the giving channel to input and edge detection, and reports the (low) PWM ratio over
 * (at least) the provided period. Based solely on GPIO interrupts (no timer), hence may not
 * behave adequately for signals with a frequency below the sampling time.
 * 
 * @returns an observable<ratio: float>, representing the time ratio (0-100) for which the signal was low
 */
function pulseInLow(channel, sampletime_ms) {
  return pulseIn(channel, sampletime_ms, 0);
}

/**
 * sets the giving channel to input and edge detection, and reports the (high) PWM ratio over
 * (at least) the provided period. Based solely on GPIO interrupts (no timer), hence may not
 * behave adequately for signals with a frequency below the sampling time.
 * 
 * @returns an observable<ratio: float>, representing the time ratio (0-100) for which the signal was high
 */
function pulseInHigh(channel, sampletime_ms) {
  return pulseIn(channel, sampletime_ms, 1);
}

export default {watch, pulseInHigh, pulseInLow };

function pulseIn(channel, sampletime_ms, trigger_edge) {
  return Observable.defer(() => {
    let starttime = new Date().getTime();
    let lowpulseoccupancy = 0;
    let start = null;
    return watch(channel, 'in', 'both')
      .distinctUntilChanged()
      .flatMap((value) => {
        let ts = new Date().getTime();
        if (value == trigger_edge)
          start = ts;
        else if (start) {
          let duration = ts-start;
          lowpulseoccupancy += duration;
          if ((ts-starttime) > sampletime_ms) {
            let ratio = 100*lowpulseoccupancy/(ts-starttime);
            lowpulseoccupancy = 0;
            starttime = ts;
            debug(`Detecting low pulse occupancy ratio on channel ${channel}: ${ratio.toFixed(2)}%`);
            return [ratio];
          }
        }
        return [];
      });
  });
}
