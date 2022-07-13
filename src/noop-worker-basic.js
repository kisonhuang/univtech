/**
 * 简单的、什么都不做的、采用即时控制的Service Worker。
 * 激活的Service Worker存在Bug，并且调查问题时想要停用客户端浏览器上的Worker的话，可以使用这个文件。
 *
 * 要激活这个Service Worker的话，需要把文件重命名为worker-basic.min.js，然后部署到服务器上。
 * 原来的Worker文件缓存过期时，这个文件会替代原来的Worker文件。
 * 浏览器会确保过期时间不会超过24小时，但是Firebase的默认过期时间为60分钟。
 */

// 跳过waiting生命周期状态，确保新的Service Worker会被立即激活，即使存在别的Tab被旧的Service Worker代码控制着
self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
});

// 获取当前打开的、Service Worker控制的所有窗口或Tab，并强制重新加载。
// 这样在激活新的Service Worker时，可以恢复打开的所有窗口或Tab，不需要手动重新加载。
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});
