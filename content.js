// injected.js를 페이지 main world에 주입하고 메시지를 background로 중계
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
;(document.head || document.documentElement).appendChild(script)
script.remove()

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data || event.data.source !== 'HUNET_ROOM_SYNC') return

  chrome.runtime.sendMessage({ type: 'ROOM_RESERVATION_EVENT', data: event.data.payload })
})
