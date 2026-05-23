// injected.js(MAIN world, 모든 프레임)에서 오는 메시지를 수신해 동기화 처리
window.addEventListener('message', (event) => {
  if (!event.data || event.data.source !== 'HUNET_ROOM_SYNC') return

  const payload = event.data.payload

  // 취소는 바로 동기화
  if (payload.action === 'cancel') {
    sendToBackground(payload)
    return
  }

  // 생성/변경은 사용자 확인 후 동기화
  showConfirmDialog(payload)
})

function sendToBackground(payload) {
  try {
    chrome.runtime.sendMessage({ type: 'ROOM_RESERVATION_EVENT', data: payload })
  } catch (_) {}
}

function showConfirmDialog(payload) {
  // 기존 다이얼로그 제거 (연속 예약 시 중복 방지)
  const existing = document.getElementById('hunet-room-sync-root')
  if (existing) existing.remove()

  const root = document.createElement('div')
  root.id = 'hunet-room-sync-root'
  document.body.appendChild(root)

  // Shadow DOM으로 다우오피스 스타일 충돌 방지
  const shadow = root.attachShadow({ mode: 'open' })

  const actionLabel = payload.action === 'create' ? '새 예약' : '변경된 예약'
  const purposeRow = payload.purpose
    ? `<div class="row"><span class="icon">📋</span><span>${payload.purpose}</span></div>`
    : ''

  shadow.innerHTML = `
    <style>
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .card {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        width: 340px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        animation: pop 0.15s ease-out;
      }
      @keyframes pop {
        from { transform: scale(0.92); opacity: 0; }
        to   { transform: scale(1);    opacity: 1; }
      }
      .title {
        font-size: 15px;
        font-weight: 700;
        color: #191E28;
        margin: 0 0 4px;
      }
      .subtitle {
        font-size: 13px;
        color: #7f8084;
        margin: 0 0 16px;
      }
      .details {
        background: #f9f9f9;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #191E28;
      }
      .icon { font-size: 14px; flex-shrink: 0; }
      .buttons {
        display: flex;
        gap: 8px;
      }
      .btn {
        flex: 1;
        padding: 10px 0;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: opacity 0.1s;
      }
      .btn:hover { opacity: 0.85; }
      .btn-confirm { background: #FF0019; color: #fff; }
      .btn-cancel  { background: #f0f0f0; color: #555; }
    </style>
    <div class="backdrop" id="backdrop">
      <div class="card">
        <p class="title">회의실 예약 동기화</p>
        <p class="subtitle">${actionLabel}을 면접 일정 시스템에 동기화할까요?</p>
        <div class="details">
          <div class="row"><span class="icon">🏢</span><span>${payload.roomName}</span></div>
          <div class="row"><span class="icon">📅</span><span>${payload.date} ${payload.startTime}~${payload.endTime}</span></div>
          ${purposeRow}
        </div>
        <div class="buttons">
          <button class="btn btn-confirm" id="btn-confirm">동기화</button>
          <button class="btn btn-cancel"  id="btn-cancel">취소</button>
        </div>
      </div>
    </div>
  `

  shadow.getElementById('btn-confirm').addEventListener('click', () => {
    sendToBackground(payload)
    root.remove()
  })

  shadow.getElementById('btn-cancel').addEventListener('click', () => {
    root.remove()
  })

}
