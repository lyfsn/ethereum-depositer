
function littleEndianToNumber(hexString) {
  const byteArray = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
  const bigEndianArray = byteArray.reverse();
  const bigEndianHexString = bigEndianArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return parseInt(bigEndianHexString, 16);
}


console.log(littleEndianToNumber("0x8bad000000000000"))