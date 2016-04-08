rx-gpio.js
==========

Watch GPIO pins with rxjs / node.js.
Provides streams for [PWM](https://www.arduino.cc/en/Tutorial/PWM) data as well.

## Setup

This module can then be installed with npm:
```
$ npm install rx-gpio
```

### Dependencies

This modules leverages [onoff](https://github.com/fivdi/onoff) to access the GPIO port.
In particular, the same numbering (BCM) as _onoff_ needs to be used.

### Usage

- Capture PWM data from [PPD42](http://www.seeedstudio.com/depot/Grove-Dust-Sensor-p-1050.html) dust sensor

```
import RxRpi from 'rx-gpio';

let gpio = 4, sampling_time = 30000;

let disp = RxRpi.pulseInLow(gpio, sampling_time)
  .map((lpo) => ({
    lpo: lpo.toFixed(2),
    concentration: Math.round(1.1*Math.pow(lpo,3)-3.8*Math.pow(lpo,2)+520*lpo+0.62)
  })
  .subscribe((x) => {
    console.log(`Low Pulse Occupancy = ${x.lpo}% / PM1 concentration = ${x.concentration} pcs/0.01cf`)
  });
  
// Disposing the subscription will cancel the watch and unexport the pin: 
// disp.dispose();
```

### API

```
/**
 * sets the given channel to the provided direction/edge, and reports any change to the returned observable<0|1>
 */
function watch(channel: int, direction: string, edge: string) { ... }
```

```
/**
 * sets the giving channel to input and edge detection, and reports the (low) PWM ratio over
 * (at least) the provided period. Based solely on GPIO interrupts (no timer), hence may not
 * behave adequately for signals with a frequency below the sampling time.
 * 
 * @returns an observable<ratio: float>, representing the time ratio (0-100) for which the signal was low
 */
function pulseInLow(channel, sampletime_ms) { ... }
```

```
/**
 * sets the giving channel to input and edge detection, and reports the (high) PWM ratio over
 * (at least) the provided period. Based solely on GPIO interrupts (no timer), hence may not
 * behave adequately for signals with a frequency below the sampling time.
 * 
 * @returns an observable<ratio: float>, representing the time ratio (0-100) for which the signal was high
 */
function pulseInHigh(channel, sampletime_ms) { ... }
```

### License

TODO
