// utils/mock-users.js

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

function isCurrentUserPost(post) {
  if (!post) {
    return false
  }

  return post.isMine || post.authorId === CURRENT_USER_ID || post.author === "当前用户"
}

function getAuthorName(post) {
  const author = String(post && post.author ? post.author : "").trim()

  if (author) {
    return author
  }

  return "匿名用户"
}

function getUserId(post) {
  if (isCurrentUserPost(post)) {
    return CURRENT_USER_ID
  }

  if (post && post.authorId) {
    return post.authorId
  }

  return "user-" + hashString(getAuthorName(post))
}

function createStats() {
  return {
    postCount: 0,
    viewCount: 0,
    likeCount: 0,
    collectCount: 0,
    commentCount: 0
  }
}

function getCommentCount(post) {
  if (post && post.comments && post.comments.length > 0) {
    return post.comments.length
  }

  return Number(post && post.commentCount ? post.commentCount : 0)
}

function createUserFromPost(post) {
  const userId = getUserId(post)
  const nickname = isCurrentUserPost(post) ? "当前用户" : getAuthorName(post)
  const seed = Number.parseInt(hashString(userId), 36) || 1
  const department = pick(departments, seed)
  const grade = pick(grades, seed + 1)
  const tags = pick(tagGroups, seed + 2)
  const day = String((seed % 26) + 1).padStart(2, "0")

  return {
    userId: userId,
    nickname: nickname,
    avatar: (post && post.avatar) || DEFAULT_AVATAR,
    bio: grade + department + "同学，关注" + tags.join("、") + "等校园话题。",
    role: "student",
    roleName: "学生",
    department: department,
    grade: grade,
    tags: tags,
    isCurrentUser: userId === CURRENT_USER_ID,
    status: "active",
    createdAt: "2025-09-" + day,
    stats: createStats(),
    relation: {
      isFollowing: false,
      isBlocked: false
    },
    posts: []
  }
}

function createAuthorInfo(user) {
  return {
    userId: user.userId,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    roleName: user.roleName,
    department: user.department,
    grade: user.grade,
    tags: user.tags,
    isCurrentUser: user.isCurrentUser,
    status: user.status
  }
}

function createSafePost(post, user) {
  const safePost = Object.assign({
    view: 0,
    like: 0,
    collect: 0,
    commentCount: 0,
    isLiked: false,
    isCollected: false,
    isMine: false,
    comments: [],
    postImg: ""
  }, post)

  safePost.author = user.nickname
  safePost.avatar = safePost.avatar || user.avatar
  safePost.authorId = user.userId
  safePost.authorInfo = createAuthorInfo(user)

  return safePost
}

function addPostStats(user, post) {
  user.stats.postCount += 1
  user.stats.viewCount += Number(post.view || 0)
  user.stats.likeCount += Number(post.like || 0)
  user.stats.collectCount += Number(post.collect || 0)
  user.stats.commentCount += getCommentCount(post)
}

function fillMockUsers(posts) {
  const sourcePosts = Array.isArray(posts) ? posts : []
  const userMap = {}
  const enrichedPosts = []

  sourcePosts.forEach(post => {
    const userId = getUserId(post)

    if (!userMap[userId]) {
      userMap[userId] = createUserFromPost(post)
    }

    const user = userMap[userId]
    const safePost = createSafePost(post, user)

    addPostStats(user, safePost)
    user.posts.push(safePost)
    enrichedPosts.push(safePost)
  })

  const users = Object.keys(userMap).map(userId => {
    const user = userMap[userId]

    user.posts = user.posts.map(post => {
      return Object.assign({}, post, {
        authorInfo: createAuthorInfo(user)
      })
    })

    return user
  })

  const finalPosts = enrichedPosts.map(post => {
    const user = userMap[post.authorId]

    return Object.assign({}, post, {
      authorInfo: createAuthorInfo(user)
    })
  })

  return {
    posts: finalPosts,
    users: users
  }
}

function canOpenAuthorProfile(target) {
  if (!target) {
    return false
  }

  const isCurrentUser = target.isCurrentUser || target.authorInfo && target.authorInfo.isCurrentUser
  const userId = target.userId || target.authorId

  return Boolean(userId && !isCurrentUser && userId !== CURRENT_USER_ID)
}

function getAuthorProfileUrl(target) {
  if (!canOpenAuthorProfile(target)) {
    return ""
  }

  return "/pages/user/user?authorId=" + (target.userId || target.authorId)
}

function findUserById(users, userId) {
  const list = Array.isArray(users) ? users : []

  return list.find(user => user.userId === userId) || null
}

module.exports = {
  CURRENT_USER_ID,
  fillMockUsers,
  canOpenAuthorProfile,
  getAuthorProfileUrl,
  findUserById
}
