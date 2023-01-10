import decoder from '@sdr.cool/demodulator-wasm'

export function setMode(mode) {
  decoder.setMode(mode)
}

export function decode(samples, frequency, tuningFreq) {
  const [left, right, signalLevel] = decoder.demodulate(samples, -tuningFreq)

  const tuning = { }
  if (signalLevel > 0.5 && tuningFreq !== 0) {
    tuning.frequency = frequency + tuningFreq
    tuning.tuningFreq = 0
  } else if (tuningFreq > 0) {
    if (tuningFreq < 300000) {
      tuning.frequency = frequency
      tuning.tuningFreq = tuningFreq + 100000
    } else {
      tuning.frequency = frequency + tuningFreq
      tuning.tuningFreq = 100000
    }
  } else if (tuningFreq < 0) {
    if (tuningFreq > -300000) {
      tuning.frequency = frequency
      tuning.tuningFreq = tuningFreq - 100000
    } else {
      tuning.frequency = frequency + tuningFreq
      tuning.tuningFreq = -100000
    }
  }

  return [left, right, signalLevel, tuning.frequency && tuning]
}