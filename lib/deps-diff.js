'use strict'

module.exports = function (newDeps, oldDeps) {
  let oldGraph = build(oldDeps)
  let newGraph = build(newDeps)
  let diff = diffKeys(newGraph, oldGraph)
  // No need to invalidate caches for `diff.added`
  let stale = diff.deleted.reduce(function (o, file) {
    o[file] = true
    return o
  }, {})
  let changed = diff.added.length + diff.deleted.length
  diff.unchanged.forEach(function (file) {
    let d = diffKeys(newGraph[file], oldGraph[file])
    // If any deps deleted, we have to invalidate the cache
    if (d.deleted.length) {
      stale[file] = true
    }
    changed += d.added.length + d.deleted.length
  })
  return changed ? Object.keys(stale) : null
}

function build(deps) {
  let graph = {}
  deps.forEach(function (dep) {
    graph[dep.dependenciesFilter] = graph[dep.dependenciesFilter] || {}
    dep.deps.forEach(function (d) {
      graph[dep.dependenciesFilter][d] = true
    })
  })
  return graph
}

function diffKeys(newObj, oldObj) {
  let added = []
  let deleted = []
  let unchanged = []

  Object.keys(newObj).forEach(function (key) {
    if (!has(oldObj, key)) {
      added.push(key)
    } else {
      unchanged.push(key)
    }
  })
  Object.keys(oldObj).forEach(function (key) {
    if (!has(newObj, key)) {
      deleted.push(key)
    } else {
      unchanged.push(key)
    }
  })

  return {
    added: added,
    deleted: deleted,
    unchanged: unchanged,
  }
}

function has(o, k) {
  return Object.prototype.hasOwnProperty.call(o, k)
}

