// 다우오피스 페이지의 XHR/fetch를 가로채 회의실 예약 이벤트를 감지 (main world에서 실행)
;(function () {
  const TARGET_HOST = 'hug.hunet.co.kr'

  function isReservationUrl(url) {
    return typeof url === 'string' && url.includes('/api/asset/')
  }

  // "2026-05-22T10:00:00.000+09:00" → "2026-05-22"
  function parseDate(iso) {
    return iso.split('T')[0]
  }

  // "2026-05-22T10:00:00.000+09:00" → "10:00"
  function parseTime(iso) {
    const m = iso.match(/T(\d{2}:\d{2})/)
    return m ? m[1] : '00:00'
  }

  function buildPayload(method, url, responseText) {
    try {
      const json = JSON.parse(responseText)
      if (json.code !== '200' || !json.data) return null

      // POST .../reserve  → 예약 생성
      // PUT  .../reserve/{id} → 예약 수정
      if ((method === 'POST' || method === 'PUT') && /\/reserve(\/\d+)?$/.test(url)) {
        const d = json.data
        // 이용 목적이 면접인 경우만 동기화
        const purpose = Array.isArray(d.properties)
          ? (d.properties.find((p) => String(p.attributeId) === '10')?.content || '')
          : ''
        if (!purpose.includes('면접')) return null
        return {
          action: method === 'POST' ? 'create' : 'update',
          externalId: d.id,
          roomName: d.itemName,
          date: parseDate(d.startTime),
          startTime: parseTime(d.startTime),
          endTime: parseTime(d.endTime),
        }
      }

      // DELETE .../asset/item/reservation → 예약 취소
      if (method === 'DELETE' && url.includes('/asset/item/reservation')) {
        const items = Array.isArray(json.data) ? json.data : [json.data]
        return items.map((item) => ({
          action: 'cancel',
          externalId: item.id,
          roomName: item.name,
        }))
      }
    } catch (_) {}
    return null
  }

  function dispatch(payload) {
    const items = Array.isArray(payload) ? payload : [payload]
    items.forEach((p) => {
      // 최상위 프레임으로 전달 (iframe context 무효화 문제 방지)
      window.top.postMessage({ source: 'HUNET_ROOM_SYNC', payload: p }, '*')
    })
  }

  // XHR 인터셉트
  const origOpen = XMLHttpRequest.prototype.open
  const origSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._hunetMethod = (method || '').toUpperCase()
    this._hunetUrl = url || ''
    return origOpen.apply(this, [method, url, ...rest])
  }

  XMLHttpRequest.prototype.send = function (...args) {
    if (isReservationUrl(this._hunetUrl)) {
      this.addEventListener('load', function () {
        if (this.status !== 200) return
        const result = buildPayload(this._hunetMethod, this._hunetUrl, this.responseText)
        if (result) dispatch(result)
      })
    }
    return origSend.apply(this, args)
  }

  // fetch 인터셉트
  const origFetch = window.fetch
  window.fetch = async function (input, init, ...rest) {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    const method = ((init && init.method) || 'GET').toUpperCase()

    const response = await origFetch.apply(this, [input, init, ...rest])

    if (isReservationUrl(url) && response.ok) {
      response.clone().text().then((text) => {
        const result = buildPayload(method, url, text)
        if (result) dispatch(result)
      })
    }

    return response
  }
})()
