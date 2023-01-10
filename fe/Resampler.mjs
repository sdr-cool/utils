
class Resampler {
  constructor(inRate, outRate) {
    this.IN_RATE = inRate
    this.OUT_RATE = outRate
  }

  resample(left, right) {
    const offlineCtx = new OfflineAudioContext(2, left.length * this.OUT_RATE / this.IN_RATE , this.OUT_RATE)
    const cloneBuffer = offlineCtx.createBuffer(2, left.length, this.IN_RATE)
    cloneBuffer.getChannelData(0).set(left)
    cloneBuffer.getChannelData(1).set(right)

    const source = offlineCtx.createBufferSource()
    source.buffer = cloneBuffer
    source.connect(offlineCtx.destination)
    offlineCtx.startRendering()
    source.start(0)
    return new Promise(resolve => {
      offlineCtx.oncomplete = ({ renderedBuffer }) => {
        resolve([renderedBuffer.getChannelData(0), renderedBuffer.getChannelData(1)])
      }
    })
  }
}

export { Resampler }