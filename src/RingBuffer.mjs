/**
 * From: https://github.com/GoogleChromeLabs/web-audio-samples/blob/main/src/audio-worklet/design-pattern/lib/wasm-audio-helper.js
 * A JS FIFO implementation for the AudioWorklet. 3 assumptions for the
 * simpler operation:
 *  1. the push and the pull operation are done by 128 frames. (Web Audio
 *    API's render quantum size in the speficiation)
 *  2. the channel count of input/output cannot be changed dynamically.
 *    The AudioWorkletNode should be configured with the `.channelCount = k`
 *    (where k is the channel count you want) and
 *    `.channelCountMode = explicit`.
 *  3. This is for the single-thread operation. (obviously)
 *
 * @class
 */
class RingBuffer {
  /**
   * @constructor
   * @param  {number} length Buffer length in frames.
   * @param  {number} channelCount Buffer channel count.
   */
  constructor(length, channelCount) {
    this._readIndex = 0;
    this._writeIndex = 0;
    this._framesAvailable = 0;

    this._channelCount = channelCount;
    this._length = length;
    this._channelData = [];
    for (let i = 0; i < this._channelCount; ++i) {
      this._channelData[i] = new Float32Array(length);
    }
  }

  /**
   * Getter for Available frames in buffer.
   *
   * @return {number} Available frames in buffer.
   */
  get framesAvailable() {
    return this._framesAvailable;
  }

  /**
   * Push a sequence of Float32Arrays to buffer.
   *
   * @param  {array} arraySequence A sequence of Float32Arrays.
   */
  push(arraySequence) {
    // The channel count of arraySequence and the length of each channel must
    // match with this buffer obejct.

    // Transfer data from the |arraySequence| storage to the internal buffer.
    const sourceLength = arraySequence[0].length;
    if (sourceLength > this._length) throw new Error('Cannot push data larger than buffer.');

    for (let channel = 0; channel < this._channelCount; ++channel) {
      const part2 = this._writeIndex + sourceLength - this._length;
      if (part2 <= 0) {
        this._channelData[channel].set(arraySequence[channel], this._writeIndex);
      } else {
        const part1 = Math.min(this._length - this._writeIndex, sourceLength);
        this._channelData[channel].set(arraySequence[channel].subarray(part1), this._writeIndex);
        this._channelData[channel].set(arraySequence[channel].subarray(-part2));
      }
    }

    this._writeIndex = (this._writeIndex + sourceLength) % this._length;
    this._framesAvailable += sourceLength;
    if (this._framesAvailable > this._length) {
      this._framesAvailable = this._length;
      this._readIndex = this._writeIndex;
    }
  }

  /**
   * Pull data out of buffer and fill a given sequence of Float32Arrays.
   *
   * @param  {array} arraySequence An array of Float32Arrays.
   */
  pull(arraySequence) {
    // The channel count of arraySequence and the length of each channel must
    // match with this buffer obejct.

    // If the FIFO is completely empty, do nothing.
    if (this._framesAvailable === 0) {
      return;
    }

    const destinationLength = arraySequence[0].length;
    if (destinationLength > this._length) throw new Error('Cannot pull data larger than buffer.');

    // Transfer data from the internal buffer to the |arraySequence| storage.
    for (let channel = 0; channel < this._channelCount; ++channel) {
      const part2 = this._readIndex + destinationLength - this._length;
      if (part2 <= 0) {
        arraySequence[channel].set(this._channelData[channel].subarray(this._readIndex, this._readIndex + destinationLength));
      } else {
        const part1 = Math.min(this._length - this._readIndex, destinationLength);
        arraySequence[channel].set(this._channelData[channel].subarray(this._readIndex));
        arraySequence[channel].set(this._channelData[channel].subarray(0, part2), part1);
      }
    }

    this._readIndex = (this._readIndex + destinationLength) % this._length;
    this._framesAvailable -= destinationLength;
    if (this._framesAvailable < 0) {
      this._framesAvailable = 0;
      this._readIndex = this._writeIndex;
    }
  }
} // class RingBuffer

export { RingBuffer }