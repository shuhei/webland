export function getPrices() {
  return fetch('./prices.data')
    .then((res) => res.arrayBuffer())
    .then(parseBinary);
}

function parseBinary(buffer) {
  var result = [];
  var view = new DataView(buffer);
  var len = buffer.byteLength;
  for (var i = 0; i < len; i += 12) {
    // Big Endian float 32
    var float1 = view.getFloat32(i, false);
    // Big Endian float 32
    var float2 = view.getFloat32(i + 4, false);
    // Big Endian integer 32
    var integer = view.getInt32(i + 8, false);
    result.push(float1, float2, integer);
  }
  return result;
}
