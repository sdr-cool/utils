import protobufjs from 'protobufjs'

const { Type, Field } = protobufjs

const SdrMessage = new Type('SdrMessage')
  .add(new Field('ts', 1, 'double'))
  .add(new Field('left', 2, 'bytes'))
  .add(new Field('right', 3, 'bytes'))
  .add(new Field('signalLevel', 4, 'double'))
  .add(new Field('mode', 5, 'string'))
  .add(new Field('frequency', 6, 'double'))
  .add(new Field('tuningFreq', 7, 'double'))

function bytesToFloat32(bytes) {
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length))
}

export function encode(obj) {
  if (obj.left) obj.left = new Uint8Array(obj.left)
  if (obj.right) obj.right = new Uint8Array(obj.right)
  return SdrMessage.encode(SdrMessage.create(obj)).finish()
}

export function decode(buf) {
  const decoded = SdrMessage.decode(buf)
  if (decoded.left.buffer) decoded.left = bytesToFloat32(decoded.left)
  if (decoded.right.buffer) decoded.right = bytesToFloat32(decoded.right)
  return decoded
}