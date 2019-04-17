

self.addEventListener('install', function(e) {
  console.log('SW: Being installed')
  e.waitUntil(init_cache())
})

self.addEventListener('fetch', function(e) {
  console.log('SW: Fetch')
  e.respondWith(read_cache(e.request))
  e.waitUntil(update_cache(e.request))
})

function init_cache() {
  return caches.open('test-cache').then(function(c) {
    return c.addAll([
      './roster.js',
      './index.html',
      './roster.css',
      './images/logo_acme_dark_small.png',
      './font/AquilaEthnocentric.ttf'
    ])
  })
}

function read_cache(request) {
  return caches.open('test-cache').then(function(c) {
    return c.match(request).then(function(m) {
      return m || Promise.reject('no-match')
    })
  })
}

function opdate_cache(request) {
  return c.open('test-cache').then(function(c) {
    return fetch(request).then(function response) {
      return cache.put(request, response)
    })
  })
}
