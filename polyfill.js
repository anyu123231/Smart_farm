// Buffer polyfill for uni-app APP-PLUS
// This file must be imported first in main.js for APP-PLUS platform

(function(globalObj) {
	if (typeof globalObj.Buffer !== 'undefined') {
		return
	}

	function BufferPolyfill() {}
	BufferPolyfill.isBuffer = function() { return false }
	BufferPolyfill.alloc = function(size) { return new Uint8Array(size) }
	BufferPolyfill.allocUnsafe = function(size) { return new Uint8Array(size) }
	BufferPolyfill.allocUnsafeSlow = function(size) { return new Uint8Array(size) }
	BufferPolyfill.from = function(data) {
		if (typeof data === 'string') {
			var arr = new Uint8Array(data.length)
			for (var i = 0; i < data.length; i++) {
				arr[i] = data.charCodeAt(i)
			}
			return arr
		}
		return new Uint8Array(data)
	}
	BufferPolyfill.prototype = Uint8Array.prototype

	globalObj.Buffer = BufferPolyfill

	console.log('Buffer polyfill loaded successfully in APP-PLUS')
})(typeof global !== 'undefined' ? global : typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this)
