const DETAIL_PAGE_ROUTE = "pages/detail/detail"
const DETAIL_PAGE_URL = "/pages/detail/detail"
const MAX_SAFE_STACK_DEPTH = 8

function getTargetPostId(postId) {
  return String(postId === undefined || postId === null ? "" : postId).trim()
}

function getCurrentPagesSafe() {
  if (typeof getCurrentPages !== "function") {
    return []
  }

  return getCurrentPages() || []
}

function getPagePostId(page) {
  if (!page) {
    return ""
  }

  if (page.options && page.options.postId !== undefined) {
    return String(page.options.postId)
  }

  if (page.data && page.data.postId !== undefined) {
    return String(page.data.postId)
  }

  return ""
}

function isSamePostDetailPage(page, postId) {
  return Boolean(page && page.route === DETAIL_PAGE_ROUTE && getPagePostId(page) === postId)
}

function buildPostDetailUrl(postId) {
  return DETAIL_PAGE_URL + "?postId=" + encodeURIComponent(postId)
}

function goPostDetail(postId) {
  const targetPostId = getTargetPostId(postId)

  if (!targetPostId || typeof wx === "undefined") {
    return false
  }

  const pages = getCurrentPagesSafe()
  const currentPage = pages[pages.length - 1]

  if (isSamePostDetailPage(currentPage, targetPostId)) {
    return false
  }

  for (let index = pages.length - 2; index >= 0; index--) {
    if (isSamePostDetailPage(pages[index], targetPostId)) {
      wx.navigateBack({
        delta: pages.length - 1 - index
      })
      return true
    }
  }

  const url = buildPostDetailUrl(targetPostId)

  if (pages.length >= MAX_SAFE_STACK_DEPTH) {
    wx.redirectTo({
      url: url
    })
    return true
  }

  wx.navigateTo({
    url: url
  })

  return true
}

module.exports = {
  goPostDetail
}
