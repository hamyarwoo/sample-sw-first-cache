//importScripts('workbox-sw.js');

var CACHE_STATIC_NAME = 'pwanote-static_v2';
var CACHE_DYNAMIC_NAME = 'pwanote-dynamic_v2';

var STATIC_ASSETS = [
    'assets/js/jquery-3.2.1.min.js',
    'assets/js/bootstrap.min.js',
    'assets/images/ar-logo-bottom.png',
    'assets/images/profile-bg.jpg',
    'assets/js/form-base.js?js=22',
    'assets/js/popper.min.js',
    'assets/fonts/font-awesome/fonts/fontawesome-webfont.ttf?v=4.7.0',
    'assets/fonts/font-awesome/css/font-awesome.min.css',
    'assets/fonts/iranyekan/iranyekanweblight.woff',
    'assets/fonts/iranyekan/iranyekanwebbold.woff',
    'assets/fonts/iranyekan/iranyekanwebregular.woff',
    'assets/css/bootstrap.min.css',
    'assets/css/rtl.css',
    'login',
    'offline',
    'assets/js/app-main.js',
    'assets/css/app_style.css',
];

function preCache() {
    // caches.open('static').then(cache => {
    //   cache.add('/');
    //   cache.add('/index.html');
    // })
    return caches.open(CACHE_STATIC_NAME)
        .then((cache) => {

            return cache.addAll(STATIC_ASSETS);
        })
        .catch(e => {
            console.error('[SW] cache ready install error', e);
        });
}

function cleanUp() {
    return caches.keys()
        .then((keys) => {
            // console.log(keys)
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {

                    return caches.delete(key);
                }
            }));
        });
}

self.addEventListener('install', function (event) {

    event.waitUntil(
        preCache()
    );
    self.skipWaiting();
});


self.addEventListener('activate', function (event) {
    event.waitUntil(cleanUp());
    return self.clients.claim();
});


function isIncluded(string, array) {
    var path;

    if (string.indexOf(self.origin) === 0) {
        // request for same domain (i.e. NOT a CDN)
        path = string.substring((self.origin + /aftabrasan-app/).length);
    } else {
        // for CDNs
        path = string;
    }

    return array.indexOf(path) > -1;
}


self.addEventListener('fetch', function (event) {
    var request = event.request;
    // cacheOnly for statics assets

    if (isIncluded(request.url, STATIC_ASSETS)) {
        event.respondWith(caches.match(request).then(function (response) {
            return response;
        }).catch(function (e) {

        }));

    } else {


        event.respondWith(
            fetch(request)
                .then((res) => {
                    // Cache latest version
                    if(event.request.method != "POST") {
                        caches.open(CACHE_DYNAMIC_NAME).then(cache => cache.put(request, res));
                    }
                    return res.clone();
                }) // Fallback to cache
                .catch(function () {

                    return caches.match(request).then(function (res) {

                        return res || fetch(request).then().catch(function () {
                                    if (request.headers.get('accept').includes('text/html')) {
                                        return caches.match('offline');
                                    }
                                });

                    })
                })
        );



    }


});

self.addEventListener('push', function(event) {
    if (event.data) {
        console.log('This push event has data: ', event.data.text());
        var options = {
            body : "test data",
            icon : "assets/images/icons/icon-96x96.png",
            badge : "assets/images/icons/icon-96x96.png",
            dir: "rtl",
        }
        self.registration.showNotification("Test Notification of aftabrasan",options);
    } else {
        console.log('This push event has no data.');
    }
});

self.addEventListener('notificationclick', event => {
    const rootUrl = new URL('/', location).href;
    event.notification.close();
    // Enumerate windows, and call window.focus(), or open a new one.
    event.waitUntil(
        clients.matchAll().then(matchedClients => {
            for (let client of matchedClients) {
                if (client.url === rootUrl) {
                    return client.focus();
                }
            }
            return clients.openWindow("/login");
        })
    );
});