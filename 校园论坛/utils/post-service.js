const forumData = require("../data/forum-data.js")
const forumStore = require("./forum-store.js")
const userStore = require("./user-store.js")
const postFilter = require("./post-filter.js")

const DEFAULT_AVATAR = "/images/avatar/default.png"
const DEFAULT_USER_NAME = "\u6821\u56ed\u7528\u6237"
const DEFAULT_ROLE_NAME = "\u7528\u6237"
const DEFAULT_CATEGORY_NAME = "\u672a\u5206\u7c7b"
const DEFAULT_SUMMARY_LENGTH = 80

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key)
}

function normalizeId(value) {
  if (value === undefined || value === null) {
    return ""
  }

  return String(value).trim()
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return ""
  }

  return String(value).trim()
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function isSameId(left, right) {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber === rightNumber
  }

  return String(left) === String(right)
}

function getSummaryLength(context) {
  const value = Number(context && (context.summaryLength || context.summaryMaxLength))

  if (!Number.isFinite(value)) {
    return DEFAULT_SUMMARY_LENGTH
  }

  return Math.max(50, Math.min(80, value))
}

function buildSummary(content, context) {
  const text = normalizeText(content).replace(/\s+/g, " ")
  const maxLength = getSummaryLength(context)

  if (text.length <= maxLength) {
    return text
  }

  return text.slice(0, maxLength) + "..."
}

function findUserById(users, userId) {
  const targetId = normalizeId(userId)

  if (!targetId) {
    return null
  }

  return asArray(users).find(user => normalizeId(user && user.userId) === targetId) || null
}

function findUserByNickname(users, nickname) {
  const targetName = normalizeText(nickname)

  if (!targetName) {
    return null
  }

  return asArray(users).find(user => normalizeText(user && user.nickname) === targetName) || null
}

function getPostAuthorInfo(post) {
  return post && typeof post.authorInfo === "object" && post.authorInfo
    ? post.authorInfo
    : {}
}

function buildAuthorView(post, context) {
  const authorInfo = getPostAuthorInfo(post)
  let userId = normalizeId(post && post.authorId) || normalizeId(authorInfo.userId)
  let user = findUserById(context && context.users, userId)

  if (!user) {
    user = findUserByNickname(context && context.users, post && post.author)

    if (!user) {
      user = findUserByNickname(context && context.users, authorInfo.nickname)
    }
  }

  if (!userId && user) {
    userId = normalizeId(user.userId)
  }

  const nickname = normalizeText(user && user.nickname) ||
    normalizeText(authorInfo.nickname) ||
    normalizeText(post && post.author) ||
    DEFAULT_USER_NAME
  const avatar = normalizeText(user && user.avatar) ||
    normalizeText(authorInfo.avatar) ||
    normalizeText(post && post.avatar) ||
    DEFAULT_AVATAR
  const roleName = normalizeText(user && user.roleName) ||
    normalizeText(authorInfo.roleName) ||
    DEFAULT_ROLE_NAME

  return {
    userId: userId,
    nickname: nickname,
    avatar: avatar,
    roleName: roleName
  }
}

function findCategory(categories, categoryName) {
  const targetName = normalizeText(categoryName)

  if (!targetName) {
    return null
  }

  return asArray(categories).find(category => {
    return normalizeText(category && category.name) === targetName ||
      normalizeId(category && category.id) === targetName
  }) || null
}

function buildCategoryView(post, context) {
  const categoryName = normalizeText(post && post.category)
  const category = findCategory(context && context.categories, categoryName)
  const name = normalizeText(category && category.name) || categoryName || DEFAULT_CATEGORY_NAME
  const categoryId = category && category.id !== undefined && category.id !== null
    ? category.id
    : null

  return {
    categoryId: categoryId,
    name: name,
    icon: normalizeText(category && category.icon),
    color: normalizeText(category && category.color)
  }
}

function buildCoverMedia(post) {
  const url = normalizeText(post && post.postImg)

  if (!url) {
    return null
  }

  const postId = normalizeId(post && post.postId) || "unknown"

  return {
    mediaId: "post-" + postId + "-cover",
    type: "image",
    usageType: "cover",
    url: url,
    thumbnailUrl: url,
    displayUrl: url,
    sortOrder: 0
  }
}

function calculateHotScore(post) {
  if (postFilter && typeof postFilter.getHeat === "function") {
    return postFilter.getHeat(post || {})
  }

  return toNumber(post && post.view) +
    toNumber(post && post.like) * 5 +
    toNumber(post && post.commentCount) * 6 +
    toNumber(post && post.collect) * 8
}

function buildStatsView(post) {
  return {
    viewCount: toNumber(post && post.view),
    likeCount: toNumber(post && post.like),
    dislikeCount: 0,
    collectCount: toNumber(post && post.collect),
    commentCount: toNumber(post && post.commentCount),
    hotScore: calculateHotScore(post)
  }
}

function buildCurrentUserState(post, currentUser) {
  const currentUserId = normalizeId(currentUser && currentUser.userId)
  const authorId = normalizeId(post && post.authorId) || normalizeId(post && post.authorInfo && post.authorInfo.userId)
  const isLiked = Boolean(post && post.isLiked)
  const isDisliked = Boolean(post && post.isDisliked)
  const isCollected = Boolean(post && post.isCollected)
  const isMine = Boolean(post && post.isMine) || Boolean(currentUserId && authorId && currentUserId === authorId)

  return {
    reaction: isDisliked ? "dislike" : isLiked ? "like" : "none",
    isLiked: isLiked,
    isDisliked: isDisliked,
    isCollected: isCollected,
    isMine: isMine,
    canEdit: isMine,
    canDelete: isMine
  }
}

function getCreatedAt(post) {
  return normalizeText(post && post.createdAt) || normalizeText(post && post.date) || null
}

function getUpdatedAt(post, createdAt) {
  return normalizeText(post && post.updatedAt) || createdAt
}

function buildLegacyAuthorInfo(post, authorView) {
  const authorInfo = getPostAuthorInfo(post)

  return Object.assign({}, authorInfo, {
    userId: normalizeId(authorInfo.userId) || authorView.userId,
    nickname: normalizeText(authorInfo.nickname) || authorView.nickname,
    avatar: normalizeText(authorInfo.avatar) || authorView.avatar,
    roleName: normalizeText(authorInfo.roleName) || authorView.roleName
  })
}

function buildDisplayFields(authorView, categoryView, coverMedia, post) {
  return {
    authorName: normalizeText(authorView && authorView.nickname) ||
      normalizeText(post && post.author) ||
      DEFAULT_USER_NAME,
    categoryName: normalizeText(categoryView && categoryView.name) ||
      normalizeText(post && post.category) ||
      DEFAULT_CATEGORY_NAME,
    authorAvatar: normalizeText(authorView && authorView.avatar) ||
      normalizeText(post && post.avatar) ||
      DEFAULT_AVATAR,
    coverUrl: normalizeText(coverMedia && coverMedia.displayUrl) ||
      normalizeText(post && post.postImg)
  }
}

function buildPostCardView(post, context) {
  if (!post) {
    return null
  }

  const safeContext = context || {}
  const authorView = buildAuthorView(post, safeContext)
  const categoryView = buildCategoryView(post, safeContext)
  const coverMedia = buildCoverMedia(post)
  const statsView = buildStatsView(post)
  const currentUserState = buildCurrentUserState(post, safeContext.currentUser)
  const createdAt = getCreatedAt(post)
  const updatedAt = getUpdatedAt(post, createdAt)
  const legacyAuthorInfo = buildLegacyAuthorInfo(post, authorView)
  const legacyAuthor = normalizeText(post.author) || authorView.nickname
  const legacyCategory = normalizeText(post.category) || categoryView.name
  const displayFields = buildDisplayFields(authorView, categoryView, coverMedia, post)

  return {
    postId: post.postId,
    title: post.title || "",
    summary: buildSummary(post.content, safeContext),

    author: authorView,
    category: categoryView,
    coverMedia: coverMedia,
    stats: statsView,
    currentUserState: currentUserState,

    status: post.status || "active",
    visibility: post.visibility || "public",

    createdAt: createdAt,
    updatedAt: updatedAt,
    displayTime: post.displayTime || post.date || createdAt || "",

    authorName: displayFields.authorName,
    categoryName: displayFields.categoryName,
    authorAvatar: displayFields.authorAvatar,
    coverUrl: displayFields.coverUrl,

    // legacy fields for current pages
    authorId: authorView.userId,
    avatar: post.avatar || authorView.avatar,
    authorInfo: legacyAuthorInfo,
    postImg: post.postImg || "",
    date: post.date || "",
    view: statsView.viewCount,
    like: statsView.likeCount,
    collect: statsView.collectCount,
    commentCount: statsView.commentCount,
    isLiked: currentUserState.isLiked,
    isCollected: currentUserState.isCollected,
    isMine: currentUserState.isMine,
    content: post.content || "",
    legacy: {
      author: legacyAuthor,
      category: legacyCategory
    }
  }
}

function safeGetUsers() {
  try {
    return userStore.getUsers()
  } catch (error) {
    return []
  }
}

function safeGetCurrentUser() {
  try {
    return userStore.getCurrentUser()
  } catch (error) {
    return null
  }
}

function resolveContext(options) {
  const safeOptions = options || {}
  const posts = hasOwn(safeOptions, "posts") ? safeOptions.posts : forumStore.getPosts()
  const users = hasOwn(safeOptions, "users") ? safeOptions.users : safeGetUsers()
  const categories = hasOwn(safeOptions, "categories") ? safeOptions.categories : forumData.categoryList
  const currentUser = hasOwn(safeOptions, "currentUser") ? safeOptions.currentUser : safeGetCurrentUser()

  return Object.assign({}, safeOptions, {
    posts: asArray(posts),
    users: asArray(users),
    categories: asArray(categories),
    currentUser: currentUser || null
  })
}

function getPostCardViews(options) {
  const context = resolveContext(options)

  return context.posts
    .map(post => buildPostCardView(post, context))
    .filter(view => Boolean(view))
}

function getPostCardView(postId, options) {
  const context = resolveContext(options)
  const targetId = normalizeId(postId)
  const post = context.posts.find(item => isSameId(item && item.postId, targetId))

  return post ? buildPostCardView(post, context) : null
}

function getHotPostCardViews(limit, options) {
  const views = getPostCardViews(options).slice()
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : views.length

  views.sort((left, right) => {
    return right.stats.hotScore - left.stats.hotScore
  })

  return views.slice(0, safeLimit)
}

module.exports = {
  getPostCardView,
  getPostCardViews,
  getHotPostCardViews,
  buildPostCardView
}
