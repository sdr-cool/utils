import _ from 'lodash'
import RtlSdr from '@sdr.cool/rtlsdrjs'

const SAMPLE_RATE = 1024 * 1e3 // Must be a multiple of 512 * BUFS_PER_SEC
const BUFS_PER_SEC = 100
const SAMPLES_PER_BUF = Math.floor(SAMPLE_RATE / BUFS_PER_SEC)
const MIN_FREQ = 5e5
const MAX_FREQ = 8e8

let sdr = null

let frequency = null
let device = ''
let deviceCb = null

export function isRunning() {
  return !!sdr
}

export async function getDevice() {
  if (device) return device
  return new Promise(r => deviceCb = r)
}

export function setFrequency(f) {
  frequency = Math.max(MIN_FREQ, Math.min(MAX_FREQ, f))
  return frequency
}

export async function start(processSamples, getInfo) {
  sdr = await RtlSdr.requestDevice()
  device = sdr._usbDevice._device.productName
  if (deviceCb) {
    deviceCb(device)
    deviceCb = null
  }

  await sdr.open({ ppm: 0.5 })
  await sdr.setSampleRate(SAMPLE_RATE)
  await sdr.setCenterFrequency(frequency)
  await sdr.resetBuffer()
  let currentFreq = frequency
  let currentInfo
  while (sdr) {
    if (currentFreq !== frequency) {
      currentFreq = frequency
      await sdr.setCenterFrequency(frequency)
      await sdr.resetBuffer()
    }

    if (getInfo) currentInfo = getInfo()
    const samples = await sdr.readSamples(SAMPLES_PER_BUF)
    if (samples.byteLength > 0) {
      processSamples(samples, currentFreq, currentInfo)
    }
  }
}

export async function stop() {
  const toClose = sdr
  sdr = null
  device = ''
  if (toClose) {
    await new Promise(r => setTimeout(r, 1000 / BUFS_PER_SEC + 10))
    toClose.close()
  }
}