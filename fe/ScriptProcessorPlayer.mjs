import { RingBuffer } from '..'

class ScriptProcessorPlayer {
  constructor(AUDIO_SAMPLE_RATE) {
    this._buffer = new RingBuffer(4096, 2)
    const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: AUDIO_SAMPLE_RATE })

    const sp = ac.createScriptProcessor(2048, 1, 2)
    sp.onaudioprocess = ({ outputBuffer }) => {
      const left = outputBuffer.getChannelData(0)
      const right = outputBuffer.getChannelData(1)
      this._buffer.pull([left, right])
    }

    const oscillator = ac.createOscillator()
    oscillator.connect(sp)
    sp.connect(ac.destination)
  }

  async play(left, right) {
    this._buffer.push([left, right])
  }
}

export { ScriptProcessorPlayer }