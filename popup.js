// 설정 저장 및 불러오기
document.addEventListener('DOMContentLoaded', async () => {
  const { apiUrl, apiKey } = await chrome.storage.sync.get(['apiUrl', 'apiKey'])
  if (apiUrl) document.getElementById('apiUrl').value = apiUrl
  if (apiKey) document.getElementById('apiKey').value = apiKey

  document.getElementById('save').addEventListener('click', async () => {
    const url = document.getElementById('apiUrl').value.trim().replace(/\/$/, '')
    const key = document.getElementById('apiKey').value.trim()
    const statusEl = document.getElementById('status')

    if (!url || !key) {
      statusEl.textContent = 'URL과 API 키를 모두 입력해주세요.'
      statusEl.className = 'error'
      return
    }

    await chrome.storage.sync.set({ apiUrl: url, apiKey: key })
    statusEl.textContent = '저장되었습니다.'
    statusEl.className = 'success'
    setTimeout(() => { statusEl.textContent = '' }, 2000)
  })
})
