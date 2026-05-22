// 예약 이벤트를 받아 면접 일정 시스템 API로 전송하는 서비스 워커
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'ROOM_RESERVATION_EVENT') return

  syncToSystem(message.data)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: err.message }))

  return true // 비동기 응답을 위해 true 반환
})

async function syncToSystem(data) {
  const { apiUrl, apiKey } = await chrome.storage.sync.get(['apiUrl', 'apiKey'])

  if (!apiUrl || !apiKey) {
    throw new Error('확장 프로그램 설정을 먼저 완료해주세요.')
  }

  const res = await fetch(`${apiUrl}/api/rooms/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `서버 오류 (${res.status})`)
  }
}
