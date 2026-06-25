const mockUsers = require("./mock-users.js")

const MINE_PAGE_URL = "/pages/mine/mine"
const USER_PAGE_ROUTE = "pages/user/user"
const USER_PAGE_URL = "/pages/user/user"
const MAX_SAFE_STACK_DEPTH = 8

function getTargetUserId(target) {
  return String(target && (target.userId || target.authorId) || "").trim()
}

function getTargetNickname(target) {
  return String(target && (target.nickname || target.author || target.authorName) || "").trim()
}

function getTargetAvatar(target) {
  return String(target && target.avatar || "").trim()
}

function getCurrentPagesSafe() {
  if (typeof getCurrentPages !== "function") {
    return []
  }

  return getCurrentPages() || []
}

function getPageAuthorId(page) {
  if (!page) {
    return ""
  }

  if (page.options && page.options.authorId) {
    return String(page.options.authorId)
  }

  if (page.data && page.data.authorId) {
    return String(page.data.authorId)
  }

  return ""
}

function isSameAuthorPage(page, userId) {
  return Boolean(page && page.route === USER_PAGE_ROUTE && getPageAuthorId(page) === userId)
}

function buildUserProfileUrl(target) {
  const userId = getTargetUserId(target)

  if (!userId) {
    return ""
  }

  let url = USER_PAGE_URL + "?authorId=" + encodeURIComponent(userId)
  const nickname = getTargetNickname(target)
  const avatar = getTargetAvatar(target)

  if (nickname) {
    url += "&nickname=" + encodeURIComponent(nickname)
  }

  if (avatar) {
    url += "&avatar=" + encodeURIComponent(avatar)
  }

  return url
}

function goUserProfile(target) {
  const userId = getTargetUserId(target)

  if (!userId || typeof wx === "undefined") {
    return false
  }

  if (userId === mockUsers.CURRENT_USER_ID) {
    wx.switchTab({
      url: MINE_PAGE_URL
    })
    return true
  }

  const pages = getCurrentPagesSafe()
  const currentPage = pages[pages.length - 1]
  const previousPage = pages[pages.length - 2]

  if (isSameAuthorPage(currentPage, userId)) {
    return false
  }

  if (isSameAuthorPage(previousPage, userId)) {
    wx.navigateBack({
      delta: 1
    })
    return true
  }

  for (let index = pages.length - 3; index >= 0; index--) {
    if (isSameAuthorPage(pages[index], userId)) {
      wx.navigateBack({
        delta: pages.length - 1 - index
      })
      return true
    }
  }

  const url = buildUserProfileUrl(target)

  if (!url) {
    return false
  }

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
  goUserProfile,
  buildUserProfileUrl
}
