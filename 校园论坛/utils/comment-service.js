const CURRENT_USER_ID = "current-user"
const DEFAULT_AVATAR = "/images/avatar/default.png"
const DEFAULT_USER_NAME = "\u6821\u56ed\u7528\u6237"
const DEFAULT_ROLE_NAME = "\u7528\u6237"
const MISSING_POST_TITLE = "\u539f\u5e16\u5df2\u4e0d\u53ef\u7528"

function asArray(value) {
  return Array.isArray(value) ? value : []
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

function isDeleted(comment) {
  return normalizeText(comment && comment.status) === "deleted"
}

function findUserById(users, userId) {
  const targetId = normalizeId(userId)

  if (!targetId) {
    return null
  }

  return asArray(users).find(user => isSameId(user && user.userId, targetId)) || null
}

function findPostById(posts, postId) {
  const targetId = normalizeId(postId)

  if (!targetId) {
    return null
  }

  return asArray(posts).find(post => isSameId(post && post.postId, targetId)) || null
}

function buildCommentMap(comments) {
  const result = {}

  asArray(comments).forEach(comment => {
    const commentId = normalizeId(comment && comment.commentId)

    if (commentId) {
      result[commentId] = comment
    }
  })

  return result
}

function getCommentCreatedTime(comment) {
  return normalizeText(comment && comment.createdAt) ||
    normalizeText(comment && comment.date)
}

function compareByTimeAsc(left, right) {
  const leftTime = getCommentCreatedTime(left)
  const rightTime = getCommentCreatedTime(right)

  return leftTime.localeCompare(rightTime)
}

function compareByTimeDesc(left, right) {
  return compareByTimeAsc(right, left)
}

function isRootComment(comment) {
  const parentCommentId = normalizeId(comment && comment.parentCommentId)
  const level = Number(comment && comment.level)

  if (Number.isFinite(level) && level > 1) {
    return false
  }

  return Number(comment && comment.level) === 1 || !parentCommentId
}

function isReplyComment(comment) {
  return !isRootComment(comment)
}

function getRootCommentId(comment, commentMap) {
  const rootCommentId = normalizeId(comment && comment.rootCommentId)

  if (rootCommentId && commentMap[rootCommentId]) {
    return rootCommentId
  }

  const parentCommentId = normalizeId(comment && comment.parentCommentId)
  const parentComment = parentCommentId ? commentMap[parentCommentId] : null

  if (!parentComment) {
    return ""
  }

  if (isRootComment(parentComment)) {
    return normalizeId(parentComment.commentId)
  }

  return getRootCommentId(parentComment, commentMap)
}

function resolveAuthor(comment, context) {
  const safeContext = context || {}
  const authorId = normalizeId(comment && comment.authorId)
  let user = findUserById(safeContext.users, authorId)

  if (!user && isCurrentUserDisplayName(comment, safeContext)) {
    user = safeContext.currentUser || null
  }

  if (!user && isTargetNicknameFallback(comment, safeContext)) {
    user = safeContext.targetUser || null
  }

  const userId = normalizeId(user && user.userId) || authorId
  const nickname = normalizeText(user && user.nickname) ||
    normalizeText(comment && comment.author) ||
    DEFAULT_USER_NAME
  const avatar = normalizeText(user && user.avatar) ||
    normalizeText(comment && comment.avatar) ||
    DEFAULT_AVATAR
  const roleName = normalizeText(user && user.roleName) || DEFAULT_ROLE_NAME

  return {
    userId: userId,
    nickname: nickname,
    avatar: avatar,
    roleName: roleName
  }
}

function hasKnownDifferentAuthor(comment, user, context) {
  const authorId = normalizeId(comment && comment.authorId)
  const userId = normalizeId(user && user.userId)

  if (!authorId || !userId || isSameId(authorId, userId) || isSameId(authorId, CURRENT_USER_ID)) {
    return false
  }

  return Boolean(findUserById(context && context.users, authorId))
}

function isCurrentUserDisplayName(comment, context) {
  const authorName = normalizeText(comment && comment.author)
  const currentUserName = normalizeText(context && context.currentUser && context.currentUser.nickname)

  return authorName === "\u5f53\u524d\u7528\u6237" ||
    Boolean(currentUserName && authorName === currentUserName)
}

function isTargetNicknameFallback(comment, context) {
  const authorName = normalizeText(comment && comment.author)
  const targetName = normalizeText(context && context.targetUser && context.targetUser.nickname)
  const fallbackNickname = normalizeText(context && context.fallbackNickname)

  return Boolean(authorName && (
    authorName === targetName ||
    authorName === fallbackNickname
  ))
}

function isCurrentUserTarget(user, context) {
  const userId = normalizeId(user && user.userId)
  const currentUserId = normalizeId(context && context.currentUser && context.currentUser.userId)

  return Boolean(context && context.isCurrentUserTarget) ||
    Boolean(userId && currentUserId && isSameId(userId, currentUserId))
}

function getCommentAuthorMatchReason(comment, user, context) {
  const safeContext = context || {}
  const safeUser = user || {}
  const authorId = normalizeId(comment && comment.authorId)
  const userId = normalizeId(safeUser.userId)
  const authorName = normalizeText(comment && comment.author)
  const userName = normalizeText(safeUser.nickname)
  const currentUserName = normalizeText(safeContext.currentUser && safeContext.currentUser.nickname)
  const fallbackNickname = normalizeText(safeContext.fallbackNickname)
  const currentUserTarget = isCurrentUserTarget(safeUser, safeContext)

  if (authorId && userId && isSameId(authorId, userId)) {
    return "authorId"
  }

  if (currentUserTarget && isSameId(authorId, CURRENT_USER_ID)) {
    return "currentUserLegacyId"
  }

  if (hasKnownDifferentAuthor(comment, safeUser, safeContext)) {
    return ""
  }

  if (currentUserTarget) {
    if (authorName === "\u5f53\u524d\u7528\u6237" ||
      Boolean(currentUserName && authorName === currentUserName) ||
      Boolean(userName && authorName === userName)) {
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

function getDefaultAuthorMatchReason(comment, context) {
  const safeContext = context || {}
  const currentUser = safeContext.currentUser || null
  const targetUser = safeContext.targetUser || null
  const currentUserReason = currentUser
    ? getCommentAuthorMatchReason(comment, currentUser, safeContext)
    : ""

  if (currentUserReason) {
    return currentUserReason === "authorId" && isSameId(comment && comment.authorId, CURRENT_USER_ID)
      ? "currentUserLegacyId"
      : currentUserReason
  }

  if (targetUser) {
    const targetUserReason = getCommentAuthorMatchReason(comment, targetUser, safeContext)

    if (targetUserReason === "authorId") {
      return targetUserReason
    }
  }

  if (isTargetNicknameFallback(comment, safeContext)) {
    return "nicknameFallback"
  }

  return "unknown"
}

function getPostView(comment, context) {
  const post = findPostById(context && context.posts, comment && comment.postId)
  const postId = comment && comment.postId !== undefined && comment.postId !== null
    ? comment.postId
    : null

  return {
    postId: post ? post.postId : postId,
    title: post ? post.title || "" : MISSING_POST_TITLE,
    available: Boolean(post)
  }
}

function isCurrentUserComment(comment, context) {
  const currentUser = context && context.currentUser

  if (!currentUser) {
    return false
  }

  const reason = getCommentAuthorMatchReason(comment, currentUser, context)

  return reason === "authorId" ||
    reason === "currentUserLegacyId" ||
    reason === "currentUserDisplayName"
}

function countReplies(comment, context) {
  const commentId = normalizeId(comment && comment.commentId)

  if (!commentId) {
    return 0
  }

  const comments = asArray(context && context.comments).filter(item => !isDeleted(item))
  const commentMap = buildCommentMap(comments)

  return comments.filter(item => {
    if (normalizeId(item && item.commentId) === commentId) {
      return false
    }

    return getRootCommentId(item, commentMap) === commentId ||
      normalizeId(item && item.parentCommentId) === commentId
  }).length
}

function resolveReplyToUser(comment, context) {
  const commentMap = buildCommentMap(context && context.comments)
  const parentCommentId = normalizeId(comment && comment.parentCommentId)
  const parentComment = parentCommentId ? commentMap[parentCommentId] : null

  if (!parentComment) {
    return null
  }

  const author = resolveAuthor(parentComment, context)

  return {
    userId: author.userId,
    nickname: author.nickname
  }
}

function buildCommentItemView(comment, context) {
  const safeContext = context || {}
  const source = comment || {}
  const author = resolveAuthor(source, safeContext)
  const post = getPostView(source, safeContext)
  const rawAuthorId = source.authorId === undefined || source.authorId === null
    ? null
    : source.authorId
  const rawAuthorName = source.author === undefined || source.author === null
    ? null
    : source.author
  const isLiked = Boolean(source.isLiked)
  const isDisliked = Boolean(source.isDisliked)
  const authorMatchReason = normalizeText(safeContext.authorMatchReason) ||
    getDefaultAuthorMatchReason(source, safeContext)
  const isMine = isCurrentUserComment(source, safeContext)
  const replyCount = safeContext.replyCount !== undefined
    ? toNumber(safeContext.replyCount)
    : countReplies(source, safeContext)

  return {
    commentId: source.commentId,
    postId: source.postId,
    parentCommentId: source.parentCommentId === undefined ? null : source.parentCommentId,
    rootCommentId: source.rootCommentId === undefined ? null : source.rootCommentId,
    level: source.level === undefined || source.level === null ? 1 : toNumber(source.level),
    content: source.content || "",
    status: source.status || "active",

    author: author,
    replyToUser: resolveReplyToUser(source, safeContext),

    stats: {
      likeCount: toNumber(source.likeCount),
      dislikeCount: toNumber(source.dislikeCount),
      replyCount: replyCount
    },

    currentUserState: {
      reaction: isDisliked ? "dislike" : isLiked ? "like" : "none",
      isLiked: isLiked,
      isDisliked: isDisliked,
      isMine: isMine,
      canDelete: isMine
    },

    post: post,

    createdAt: normalizeText(source.createdAt) || normalizeText(source.date),
    displayTime: normalizeText(source.date) || normalizeText(source.createdAt),

    authorMatchReason: authorMatchReason,

    authorId: rawAuthorId,
    rawAuthorId: rawAuthorId,
    legacyAuthorId: rawAuthorId,
    authorName: author.nickname,
    rawAuthorName: rawAuthorName,
    avatar: author.avatar,
    date: normalizeText(source.date) || normalizeText(source.createdAt),
    postTitle: post.title,
    postAvailable: post.available
  }
}

function buildCommentThreadView(rootComment, replies, context) {
  const safeReplies = asArray(replies).filter(reply => !isDeleted(reply)).slice().sort(compareByTimeAsc)
  const replyCount = safeReplies.length
  const rootContext = Object.assign({}, context || {}, {
    replyCount: replyCount
  })

  return {
    rootComment: buildCommentItemView(rootComment, rootContext),
    replies: safeReplies.map(reply => buildCommentItemView(reply, context)),
    replyCount: replyCount
  }
}

function getPostCommentViews(postId, options) {
  const safeOptions = options || {}
  const comments = asArray(safeOptions.comments)
    .filter(comment => !isDeleted(comment))
    .filter(comment => isSameId(comment && comment.postId, postId))
  const commentMap = buildCommentMap(comments)
  const rootComments = comments.filter(isRootComment).slice().sort(compareByTimeDesc)
  const repliesByRootId = {}
  const orphanReplies = []

  comments.filter(isReplyComment).forEach(comment => {
    const rootCommentId = getRootCommentId(comment, commentMap)

    if (rootCommentId) {
      if (!repliesByRootId[rootCommentId]) {
        repliesByRootId[rootCommentId] = []
      }

      repliesByRootId[rootCommentId].push(comment)
      return
    }

    orphanReplies.push(comment)
  })

  const threads = rootComments.map(rootComment => {
    const rootCommentId = normalizeId(rootComment && rootComment.commentId)

    return buildCommentThreadView(rootComment, repliesByRootId[rootCommentId] || [], safeOptions)
  })

  orphanReplies.sort(compareByTimeDesc).forEach(reply => {
    threads.push(buildCommentThreadView(reply, [], safeOptions))
  })

  return threads
}

function getUserCommentViews(userId, options) {
  const safeOptions = options || {}
  const targetUser = safeOptions.targetUser || findUserById(safeOptions.users, userId) || {
    userId: userId,
    nickname: safeOptions.fallbackNickname || ""
  }

  return asArray(safeOptions.comments)
    .filter(comment => !isDeleted(comment))
    .map(comment => {
      const authorMatchReason = getCommentAuthorMatchReason(comment, targetUser, safeOptions)

      return authorMatchReason
        ? buildCommentItemView(comment, Object.assign({}, safeOptions, {
          targetUser: targetUser,
          authorMatchReason: authorMatchReason
        }))
        : null
    })
    .filter(item => Boolean(item))
    .sort(compareByTimeDesc)
}

module.exports = {
  buildCommentItemView,
  buildCommentThreadView,
  getPostCommentViews,
  getUserCommentViews
}
