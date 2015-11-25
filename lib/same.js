module.exports = function same(p, q) {
  if (p === q) {
    return true
  }

  var arrNum = Array.isArray(p) + Array.isArray(q)

  if (arrNum === 2) {
    return sameArr(p, q)
  }

  if (arrNum > 0) {
    return false
  }

  if (typeof p !== 'object' || typeof q !== 'object') {
    return p === q
  }

  var pKeys = Object.keys(p)
  var qKeys = Object.keys(q)

  if (!sameArr(pKeys, qKeys)) {
    return false
  }

  var key
  for (var i = 0, len = pKeys.length; i < len; ++i) {
    key = pKeys[i]
    if (!same(p[key], q[key])) {
      return false
    }
  }

  return true
}

function sameArr(p, q) {
  p = unique(p)
  q = unique(q)

  if (p.length !== q.length) {
    return false
  }

  p.sort()
  q.sort()

  for (var i = 0, len = p.length; i < len; ++i) {
    if (p[i] !== q[i]) {
      return false
    }
  }

  return true
}

function unique(arr) {
  return Object.keys(arr.reduce(function (o, v) {
    o[v] = true
    return o
  }, {}))
}

