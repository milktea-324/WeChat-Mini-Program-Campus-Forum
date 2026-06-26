const USER_STORAGE_KEY = "forum_users"
const CURRENT_USER_STORAGE_KEY = "forum_current_user"
const CURRENT_USER_ID = "current-user"
const DEFAULT_AVATAR = "/images/avatar/default.png"

const departments = [
  "计算机学院",
  "外国语学院",
  "经济管理学院",
  "艺术设计学院",
  "机电工程学院",
  "数学与统计学院"
]

const grades = [
  "2022级",
  "2023级",
  "2024级",
  "2025级"
]

const tagGroups = [
  ["学习交流", "资料整理"],
  ["校园生活", "经验分享"],
  ["社团活动", "活动策划"],
  ["二手交易", "实用信息"],
  ["失物招领", "互助"],
  ["考试资料", "复习"]
]

function hasWxStorage() {
  return typeof wx !== "undefined" && wx &&
    typeof wx.getStorageSync === "function" &&
    typeof wx.setStorageSync === "function"
}

function getStorage(key) {
  if (!hasWxStorage()) {
    return undefined
  }

  return wx.getStorageSync(key)
}

function setStorage(key, value) {
  if (!hasWxStorage()) {
    return
  }

  wx.setStorageSync(key, value)
}

function removeStorage(key) {
  if (typeof wx === "undefined" || !wx) {
    return
  }

  if (typeof wx.removeStorageSync === "function") {
    wx.removeStorageSync(key)
    return
  }

  if (typeof wx.setStorageSync === "function") {
    wx.setStorageSync(key, undefined)
  }
}

function hashString(text) {
  const value = String(text || "")
  let hash = 0

  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

function pick(list, seed) {
  return list[seed % list.length]
}

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return year + "-" + month + "-" + day
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map(item => String(item || "").trim())
      .filter(item => item !== "")
  }

  const tag = String(tags || "").trim()

  return tag ? [tag] : []
}

function normalizeUser(user) {
  const source = user || {}
  const userId = String(source.userId || "").trim()

  if (!userId) {
    return null
  }

  const today = getToday()
  const nickname = String(source.nickname || "").trim() || "校园用户"
  const avatar = String(source.avatar || "").trim() || DEFAULT_AVATAR

  return Object.assign({}, source, {
    userId: userId,
    nickname: nickname,
    avatar: avatar,
    bio: source.bio || "",
    role: source.role || "student",
    roleName: source.roleName || "学生",
    department: source.department || "计算机学院",
    grade: source.grade || "2024级",
    tags: normalizeTags(source.tags),
    status: source.status || "active",
    createdAt: source.createdAt || today,
    updatedAt: source.updatedAt || source.createdAt || today,
    isCurrentUser: userId === CURRENT_USER_ID
  })
}

function getUsers() {
  const users = getStorage(USER_STORAGE_KEY)

  if (!Array.isArray(users)) {
    return []
  }

  return users
    .map(normalizeUser)
    .filter(user => Boolean(user))
}

function saveUsers(users) {
  const sourceUsers = Array.isArray(users) ? users : []
  const userMap = {}
  const userIds = []

  sourceUsers.forEach(user => {
    const safeUser = normalizeUser(user)

    if (!safeUser) {
      return
    }

    if (!userMap[safeUser.userId]) {
      userIds.push(safeUser.userId)
    }

    userMap[safeUser.userId] = safeUser
  })

  const result = userIds.map(userId => userMap[userId])

  setStorage(USER_STORAGE_KEY, result)

  return result
}

function findUserById(userId) {
  const targetId = String(userId || "").trim()

  if (!targetId) {
    return null
  }

  return getUsers().find(user => user.userId === targetId) || null
}

function getCurrentUserRef() {
  const ref = getStorage(CURRENT_USER_STORAGE_KEY)
  const userId = ref && ref.userId ? String(ref.userId).trim() : ""

  return {
    userId: userId || CURRENT_USER_ID
  }
}

function setCurrentUserRef(userId) {
  const ref = {
    userId: String(userId || "").trim() || CURRENT_USER_ID
  }

  setStorage(CURRENT_USER_STORAGE_KEY, ref)

  return ref
}

function createDefaultCurrentUser() {
  return normalizeUser({
    userId: CURRENT_USER_ID,
    nickname: "当前用户",
    avatar: DEFAULT_AVATAR,
    bio: "",
    role: "student",
    roleName: "学生",
    department: "计算机学院",
    grade: "2024级",
    tags: ["校园用户"],
    status: "active"
  })
}

function isCurrentUserPost(post) {
  return Boolean(post && (
    post.isMine ||
    post.authorId === CURRENT_USER_ID ||
    post.author === "当前用户"
  ))
}

function getPostAuthorName(post) {
  const author = String(post && post.author || "").trim()

  return author || "校园用户"
}

function getPostUserId(post) {
  if (isCurrentUserPost(post)) {
    return CURRENT_USER_ID
  }

  if (post && post.authorId) {
    return String(post.authorId).trim()
  }

  return "user-" + hashString(getPostAuthorName(post))
}

function createUserFromPost(post) {
  const userId = getPostUserId(post)
  const nickname = userId === CURRENT_USER_ID ? "当前用户" : getPostAuthorName(post)
  const seed = Number.parseInt(hashString(userId), 36) || 1
  const department = pick(departments, seed)
  const grade = pick(grades, seed + 1)
  const tags = pick(tagGroups, seed + 2)
  const day = String((seed % 26) + 1).padStart(2, "0")

  return normalizeUser({
    userId: userId,
    nickname: nickname,
    avatar: post && post.avatar || DEFAULT_AVATAR,
    bio: grade + department + "同学，关注" + tags.join("、") + "等校园话题。",
    role: "student",
    roleName: "学生",
    department: department,
    grade: grade,
    tags: tags,
    status: "active",
    createdAt: "2025-09-" + day,
    updatedAt: "2025-09-" + day
  })
}

function getCommentAuthorName(comment) {
  const author = String(comment && comment.author || "").trim()

  return author || "\u6821\u56ed\u7528\u6237"
}

function getCommentUserId(comment) {
  const authorId = String(comment && comment.authorId || "").trim()

  if (authorId) {
    return authorId
  }

  const author = getCommentAuthorName(comment)

  if (author === "\u5f53\u524d\u7528\u6237") {
    return CURRENT_USER_ID
  }

  return "comment-author-" + hashString(author)
}

function createUserFromComment(comment) {
  const userId = getCommentUserId(comment)
  const nickname = userId === CURRENT_USER_ID ? "\u5f53\u524d\u7528\u6237" : getCommentAuthorName(comment)
  const seed = Number.parseInt(hashString(userId), 36) || 1
  const department = pick(departments, seed)
  const grade = pick(grades, seed + 1)
  const tags = pick(tagGroups, seed + 2)
  const day = String((seed % 26) + 1).padStart(2, "0")

  return normalizeUser({
    userId: userId,
    nickname: nickname,
    avatar: comment && comment.avatar || DEFAULT_AVATAR,
    bio: grade + department + "\u540c\u5b66\uff0c\u5173\u6ce8" + tags.join("\u3001") + "\u7b49\u6821\u56ed\u8bdd\u9898\u3002",
    role: "student",
    roleName: "\u5b66\u751f",
    department: department,
    grade: grade,
    tags: tags,
    status: "active",
    createdAt: "2025-09-" + day,
    updatedAt: "2025-09-" + day
  })
}

function ensureCurrentUser() {
  const users = getUsers()
  const currentUser = users.find(user => user.userId === CURRENT_USER_ID) || createDefaultCurrentUser()
  const nextUsers = saveUsers(users.concat(currentUser))

  setCurrentUserRef(getCurrentUserRef().userId || CURRENT_USER_ID)

  return nextUsers.find(user => user.userId === CURRENT_USER_ID)
}

function getCurrentUser() {
  ensureCurrentUser()

  const ref = getCurrentUserRef()
  const targetUser = findUserById(ref.userId)

  if (targetUser) {
    return targetUser
  }

  return findUserById(CURRENT_USER_ID) || ensureCurrentUser()
}

function ensureUsersFromPosts(posts) {
  const sourcePosts = Array.isArray(posts) ? posts : []
  const users = getUsers()
  const generatedUsers = sourcePosts
    .map(createUserFromPost)
    .filter(user => Boolean(user))

  const result = saveUsers(users.concat(generatedUsers, createDefaultCurrentUser()))

  setCurrentUserRef(getCurrentUserRef().userId || CURRENT_USER_ID)

  return result
}

function ensureUsersFromComments(comments) {
  const sourceComments = Array.isArray(comments) ? comments : []
  const users = getUsers()
  const generatedUsers = sourceComments
    .map(createUserFromComment)
    .filter(user => Boolean(user))

  const result = saveUsers(users.concat(generatedUsers, createDefaultCurrentUser()))

  setCurrentUserRef(getCurrentUserRef().userId || CURRENT_USER_ID)

  return result
}

function resetUsersForTest() {
  removeStorage(USER_STORAGE_KEY)
  removeStorage(CURRENT_USER_STORAGE_KEY)
}

module.exports = {
  getUsers,
  saveUsers,
  findUserById,
  getCurrentUserRef,
  setCurrentUserRef,
  ensureCurrentUser,
  getCurrentUser,
  normalizeUser,
  createDefaultCurrentUser,
  createUserFromPost,
  ensureUsersFromPosts,
  createUserFromComment,
  ensureUsersFromComments,
  resetUsersForTest
}
