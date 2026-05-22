// injected.js(MAIN world, 모든 프레임)에서 오는 메시지를 background로 중계
// iframe에서 window.top으로 보낸 메시지도 수신하므로 event.source 체크 생략
window.addEventListener('message', (event) => {
  if (!event.data || event.data.source !== 'HUNET_ROOM_SYNC') return

  chrome.runtime.sendMessage({ type: 'ROOM_RESERVATION_EVENT', data: event.data.payload })
})
