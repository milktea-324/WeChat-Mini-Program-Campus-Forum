const forumData = require("../data/forum-data.js")
const commentStore = require("./comment-store.js")
const postService = require("./post-service.js")
const userStore = require("./user-store.js")

const POSTS_STORAGE_KEY = "forum_posts"
const COMMENTS_STORAGE_KEY = "forum_comments"
const MY_POSTS_STORAGE_KEY = "forum_my_posts"
const CURRENT_USER_ID = "current-user"
const DEFAULT_AVATAR = "/images/avatar/default.png"
const DEFAULT_NICKNAME = "校园用户"

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
  const leftId = normalizeId(left)
  const rightId = normalizeId(right)

  if (!leftId || !rightId) {
    return false
  }

  const leftNumber = Number(leftId)
  const rightNumber = Number(rightId)

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber === rightNumber
  }

  return leftId === rightId
}

function hasWxStorage() {
  return typeof wx !== "undefined" && wx &&
    typeof wx.getStorageSync === "function"
}

function safeGetStorage(key) {
  if (!hasWxStorage()) {
    return undefined
  }

  try {
    return wx.getStorageSync(key)
  } catch (error) {
    return undefined
  }
}

function safeGetUsers() {
  try {
    return userStore.getUsers()
  } catch (error) {
    return []
  }
}

function safeGetCurrentUser(users) {
  try {
    const currentUserRef = userStore.getCurrentUserRef()
    const currentUserId = normalizeId(currentUserRef && currentUserRef.userId) || CURRENT_USER_ID

    return findUserById(users, currentUserId) || {
      userId: currentUserId
    }
  } catch (error) {
    return findUserById(users, CURRENT_USER_ID) || {
      userId: CURRENT_USER_ID
    }
  }
}

function safeGetPosts() {
  const posts = safeGetStorage(POSTS_STORAGE_KEY)

  if (Array.isArray(posts)) {
    return posts
  }

  return forumData.postList || []
}

function safeGetComments(posts) {
  const comments = safeGetStorage(COMMENTS_STORAGE_KEY)

  if (Array.isArray(comments)) {
    return comments
  }

  try {
    return commentStore.migrateCommentsFromPosts(posts)
  } catch (error) {
    return []
  }
}

function safeGetMyPostIds() {
  const myPostIds = safeGetStorage(MY_POSTS_STORAGE_KEY)

  return Array.isArray(myPostIds) ? myPostIds : []
}

function findUserById(users, userId) {
  const targetId = normalizeId(userId)

  if (!targetId) {
    return null
  }

  return asArray(users).find(user => isSameId(user && user.userId, targetId)) || null
}

function findCurrentUser(users) {
  return asArray(users).find(user => {
    return Boolean(user && user.isCurrentUser) || isSameId(user && user.userId, CURRENT_USER_ID)
  }) || null
}

function getPostAuthorId(post) {
  return normalizeId(post && post.authorId) ||
    normalizeId(post && post.authorInfo && post.authorInfo.userId)
}

function getPostAuthorName(post) {
  return normalizeText(post && post.author) ||
    normalizeText(post && post.authorInfo && post.authorInfo.nickname)
}

function getPostAuthorAvatar(post) {
  return normalizeText(post && post.avatar) ||
    normalizeText(post && post.authorInfo && post.authorInfo.avatar)
}

function normalizeProfileUser(user, fallback) {
  const source = user || {}
  const safeFallback = fallback || {}
  const userId = normalizeId(source.userId) || normalizeId(safeFallback.userId)

  return {
    userId: userId,
    nickname: normalizeText(source.nickname) || normalizeText(safeFallback.nickname) || DEFAULT_NICKNAME,
    avatar: normalizeText(source.avatar) || normalizeText(safeFallback.avatar) || DEFAULT_AVATAR,
    bio: normalizeText(source.bio) || normalizeText(safeFallback.bio),
    role: normalizeText(source.role) || normalizeText(safeFallback.role) || "student",
    roleName: normalizeText(source.roleName) || normalizeText(safeFallback.roleName) || "用户",
    department: normalizeText(source.department) || normalizeText(safeFallback.department) || "校园论坛",
    grade: normalizeText(source.grade) || normalizeText(safeFallback.grade) || "资料未完善"
  }
}

function createPostMap(posts) {
  const result = {}

  asArray(posts).forEach(post => {
    const postId = normalizeId(post && post.postId)

    if (postId) {
      result[postId] = post
    }
  })

  return result
}

function hasKnownDifferentAuthor(comment, user, options) {
  const authorId = normalizeId(comment && comment.authorId)
  const userId = normalizeId(user && user.userId)

  if (!authorId || !userId || isSameId(authorId, userId) || isSameId(authorId, CURRENT_USER_ID)) {
    return false
  }

  return Boolean(findUserById(options && options.users, authorId))
}

function getCommentAuthorMatchReason(comment, user, options) {
  const safeOptions = options || {}
  const authorId = normalizeId(comment && comment.authorId)
  const authorName = normalizeText(comment && comment.author)
  const userId = normalizeId(user && user.userId)
  const userName = normalizeText(user && user.nickname)
  const currentUser = safeOptions.currentUser || null
  const currentUserName = normalizeText(currentUser && currentUser.nickname)
  const fallbackNickname = normalizeText(safeOptions.fallbackNickname)
  const isCurrentUserTarget = Boolean(safeOptions.isCurrentUserTarget)

  if (authorId && userId && isSameId(authorId, userId)) {
    return "authorId"
  }

  if (isCurrentUserTarget) {
    if (isSameId(authorId, CURRENT_USER_ID)) {
      return "currentUserLegacyId"
    }
  }

  // Follow-up hardening can expand this beyond the supplied users list.
  // For now, known different authorIds block nickname-only fallback.
  if (hasKnownDifferentAuthor(comment, user, safeOptions)) {
    return ""
  }

  if (isCurrentUserTarget) {
    if (authorName === "当前用户") {
      return "currentUserDisplayName"
    }

    if (currentUserName && authorName === currentUserName) {
      return "currentUserDisplayName"
    }

    if (userName && authorName === userName) {
      return "currentUserDisplayName"
    }
  }

  if (userName && authorName === userName) {
    return "nicknameFallback"
  }

  if (fallbackNickname && authorName === fallbackNickname) {
    return "nicknameFallback"
  }

  return ""
}

function isCommentAuthoredByUser(comment, user, options) {
  return Boolean(getCommentAuthorMatchReason(comment, user, options))
}

function addPostAvailability(comment, postMap, authorMatchReason) {
  const post = postMap[normalizeId(comment && comment.postId)]
  const postAvailable = Boolean(post)

  return Object.assign({}, comment, {
    postTitle: postAvailable ? post.title : "原帖已不可用",
    postAvailable: postAvailable,
    authorMatchReason: authorMatchReason || ""
  })
}

function buildPostCardViews(posts, context, currentUser) {
  const safeContext = context || {}
  const cardContext = {
    users: asArray(safeContext.users),
    categories: hasOwn(safeContext, "categories")
      ? asArray(safeContext.categories)
      : forumData.categoryList,
    currentUser: currentUser || safeContext.currentUser || null
  }

  return asArray(posts)
    .map(post => postService.buildPostCardView(post, cardContext))
    .filter(view => Boolean(view))
}

function isMyPost(post, myPostIds) {
  return Boolean(post && post.isMine) ||
    asArray(myPostIds).some(postId => isSameId(postId, post && post.postId))
}

function isUserPost(post, userId) {
  return isSameId(getPostAuthorId(post), userId)
}

function buildCommentViews(comments, user, postMap, options) {
  return asArray(comments)
    .map(comment => {
      const authorMatchReason = getCommentAuthorMatchReason(comment, user, options)

      return authorMatchReason
        ? addPostAvailability(comment, postMap, authorMatchReason)
        : null
    })
    .filter(comment => Boolean(comment))
}

function sumPostField(posts, field) {
  return asArray(posts).reduce((total, post) => {
    return total + toNumber(post && post[field])
  }, 0)
}

function resolveMineUser(context) {
  const users = asArray(context && context.users)
  const currentUser = context && context.currentUser

  if (currentUser && normalizeId(currentUser.userId)) {
    return currentUser
  }

  return findCurrentUser(users) || {
    userId: CURRENT_USER_ID
  }
}

function createFallbackUserFromPost(userId, posts) {
  const post = asArray(posts).find(item => isUserPost(item, userId))

  if (!post) {
    return null
  }

  return {
    userId: userId,
    nickname: getPostAuthorName(post),
    avatar: getPostAuthorAvatar(post)
  }
}

function resolveTargetUser(userId, context) {
  const targetId = normalizeId(userId)
  const users = asArray(context && context.users)
  const explicitTargetUser = context && context.targetUser

  if (explicitTargetUser && (!targetId || isSameId(explicitTargetUser.userId, targetId))) {
    return explicitTargetUser
  }

  return findUserById(users, targetId)
}

function buildMineProfileView(context) {
  const safeContext = context || {}
  const posts = asArray(safeContext.posts)
  const comments = asArray(safeContext.comments)
  const currentUser = resolveMineUser(safeContext)
  const user = normalizeProfileUser(currentUser, {
    userId: CURRENT_USER_ID,
    nickname: DEFAULT_NICKNAME,
    avatar: DEFAULT_AVATAR
  })
  const postMap = createPostMap(posts)
  const myPostIds = asArray(safeContext.myPostIds)
  const myPosts = posts.filter(post => isMyPost(post, myPostIds))
  const likedPosts = posts.filter(post => Boolean(post && post.isLiked))
  const collectedPosts = posts.filter(post => Boolean(post && post.isCollected))
  const myComments = buildCommentViews(comments, user, postMap, {
    users: safeContext.users,
    currentUser: currentUser,
    isCurrentUserTarget: true
  })

  return {
    user: user,
    stats: {
      postCount: myPosts.length,
      likedPostCount: likedPosts.length,
      collectedPostCount: collectedPosts.length,
      commentCount: myComments.length,
      receivedViewCount: sumPostField(myPosts, "view"),
      receivedLikeCount: sumPostField(myPosts, "like"),
      receivedCollectCount: sumPostField(myPosts, "collect")
    },
    lists: {
      myPosts: buildPostCardViews(myPosts, safeContext, user),
      likedPosts: buildPostCardViews(likedPosts, safeContext, user),
      collectedPosts: buildPostCardViews(collectedPosts, safeContext, user),
      myComments: myComments
    }
  }
}

function buildUserProfileView(userId, context) {
  const safeContext = context || {}
  const targetId = normalizeId(userId)
  const posts = asArray(safeContext.posts)
  const comments = asArray(safeContext.comments)
  const currentUser = resolveMineUser(safeContext)
  const targetUser = resolveTargetUser(targetId, safeContext)
  const fallbackUser = createFallbackUserFromPost(targetId, posts)
  const isMissingUser = !targetUser
  const user = normalizeProfileUser(targetUser || fallbackUser, {
    userId: targetId,
    nickname: normalizeText(safeContext.fallbackNickname) || DEFAULT_NICKNAME,
    avatar: normalizeText(safeContext.fallbackAvatar) || DEFAULT_AVATAR,
    bio: "这位同学暂时还没有公开发布内容。"
  })
  const postMap = createPostMap(posts)
  const authorPosts = user.userId
    ? posts.filter(post => isUserPost(post, user.userId))
    : []
  const authorComments = user.userId
    ? buildCommentViews(comments, user, postMap, {
      users: safeContext.users,
      currentUser: currentUser,
      fallbackNickname: safeContext.fallbackNickname,
      isCurrentUserTarget: Boolean(user.userId && isSameId(user.userId, currentUser && currentUser.userId))
    })
    : []
  const isCurrentUser = Boolean(user.userId && isSameId(user.userId, currentUser && currentUser.userId))

  return {
    user: user,
    stats: {
      postCount: authorPosts.length,
      commentCount: authorComments.length,
      viewCount: sumPostField(authorPosts, "view"),
      likeCount: sumPostField(authorPosts, "like"),
      collectCount: sumPostField(authorPosts, "collect")
    },
    lists: {
      authorPosts: buildPostCardViews(authorPosts, safeContext, currentUser),
      authorComments: authorComments
    },
    state: {
      isCurrentUser: isCurrentUser,
      isMissingUser: isMissingUser,
      canViewProfile: Boolean(user.userId)
    }
  }
}

function resolveReadContext(options) {
  const safeOptions = options || {}
  const posts = hasOwn(safeOptions, "posts") ? safeOptions.posts : safeGetPosts()
  const comments = hasOwn(safeOptions, "comments") ? safeOptions.comments : safeGetComments(posts)
  const users = hasOwn(safeOptions, "users") ? safeOptions.users : safeGetUsers()
  const currentUser = hasOwn(safeOptions, "currentUser")
    ? safeOptions.currentUser
    : safeGetCurrentUser(users)
  const myPostIds = hasOwn(safeOptions, "myPostIds") ? safeOptions.myPostIds : safeGetMyPostIds()

  return Object.assign({}, safeOptions, {
    posts: asArray(posts),
    comments: asArray(comments),
    users: asArray(users),
    currentUser: currentUser || null,
    myPostIds: asArray(myPostIds)
  })
}

function getMineProfileView(options) {
  return buildMineProfileView(resolveReadContext(options))
}

function getUserProfileView(userId, options) {
  const context = resolveReadContext(options)

  if (!hasOwn(context, "targetUser")) {
    context.targetUser = findUserById(context.users, userId)
  }

  return buildUserProfileView(userId, context)
}

module.exports = {
  buildMineProfileView,
  buildUserProfileView,
  getMineProfileView,
  getUserProfileView,
  isCommentAuthoredByUser,
  getCommentAuthorMatchReason
}
