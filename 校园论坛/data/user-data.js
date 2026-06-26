const forumData = require("./forum-data.js")

const DEFAULT_AVATAR = "/images/avatar/default.png"

const departments = [
  "\u8ba1\u7b97\u673a\u5b66\u9662",
  "\u5916\u56fd\u8bed\u5b66\u9662",
  "\u7ecf\u6d4e\u7ba1\u7406\u5b66\u9662",
  "\u827a\u672f\u8bbe\u8ba1\u5b66\u9662",
  "\u673a\u7535\u5de5\u7a0b\u5b66\u9662",
  "\u6570\u5b66\u4e0e\u7edf\u8ba1\u5b66\u9662"
]

const grades = [
  "2022\u7ea7",
  "2023\u7ea7",
  "2024\u7ea7",
  "2025\u7ea7"
]

const tagGroups = [
  ["\u5b66\u4e60\u4ea4\u6d41", "\u8d44\u6599\u6574\u7406"],
  ["\u6821\u56ed\u751f\u6d3b", "\u7ecf\u9a8c\u5206\u4eab"],
  ["\u793e\u56e2\u6d3b\u52a8", "\u6d3b\u52a8\u7b56\u5212"],
  ["\u4e8c\u624b\u4ea4\u6613", "\u5b9e\u7528\u4fe1\u606f"],
  ["\u5931\u7269\u62db\u9886", "\u4e92\u52a9"],
  ["\u8003\u8bd5\u8d44\u6599", "\u590d\u4e60"]
]

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

function normalizeNickname(nickname) {
  return String(nickname || "").trim()
}

function getSeedUserIdByNickname(nickname) {
  const name = normalizeNickname(nickname)

  if (!name) {
    return ""
  }

  return "user-" + hashString(name)
}

function createSeedUserFromPost(post, index) {
  const nickname = normalizeNickname(post && post.author) || "\u6821\u56ed\u7528\u6237"
  const userId = String(post && post.authorId || "").trim() || getSeedUserIdByNickname(nickname)
  const seed = Number.parseInt(hashString(userId), 36) || (index + 1)
  const department = pick(departments, seed)
  const grade = pick(grades, seed + 1)
  const tags = pick(tagGroups, seed + 2)
  const day = String((seed % 26) + 1).padStart(2, "0")
  const createdAt = "2025-09-" + day

  return {
    userId: userId,
    nickname: nickname,
    avatar: String(post && post.avatar || "").trim() || DEFAULT_AVATAR,
    bio: grade + department + "\u540c\u5b66\uff0c\u5173\u6ce8" + tags.join("\u3001") + "\u7b49\u6821\u56ed\u8bdd\u9898\u3002",
    role: "student",
    roleName: "\u5b66\u751f",
    department: department,
    grade: grade,
    tags: tags,
    status: "active",
    createdAt: createdAt,
    updatedAt: createdAt
  }
}

function createSeedUsers() {
  const sourcePosts = Array.isArray(forumData.postList) ? forumData.postList : []
  const users = []
  const seen = {}

  sourcePosts.forEach((post, index) => {
    const user = createSeedUserFromPost(post, index)

    if (!user.userId || seen[user.userId]) {
      return
    }

    seen[user.userId] = true
    users.push(user)
  })

  return users
}

const userList = createSeedUsers()

function findSeedUserById(userId) {
  const targetId = String(userId || "").trim()

  if (!targetId) {
    return null
  }

  return userList.find(user => user.userId === targetId) || null
}

function findSeedUserByNickname(nickname) {
  const targetName = normalizeNickname(nickname)

  if (!targetName) {
    return null
  }

  return userList.find(user => normalizeNickname(user.nickname) === targetName) || null
}

module.exports = {
  userList,
  findSeedUserById,
  findSeedUserByNickname,
  getSeedUserIdByNickname,
  normalizeNickname
}
