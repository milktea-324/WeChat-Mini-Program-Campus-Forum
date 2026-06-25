const forumStore = require("./forum-store.js")
const mockUsers = require("./mock-users.js")

const COMMENTS_STORAGE_KEY = "forum_comments"
const DEFAULT_AVATAR = "/images/avatar/default.png"

function hashString(text) {
  const value = String(text || "")
  let hash = 0

  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

function getStableAuthorId(author, post) {
  const name = String(author || "").trim()

  if (name === "当前用户") {
    return mockUsers.CURRENT_USER_ID
  }

  if (post && post.authorId) {
    return post.authorId
  }

  if (name) {
    return "comment-author-" + hashString(name)
  }

  return "comment-author-unknown"
}

function createCommentId(comment, post) {
  const postId = post && post.postId !== undefined && post.postId !== null
    ? post.postId
    : comment && comment.postId

  const seed = [
    postId,
    comment && comment.author,
    comment && comment.content,
    comment && (comment.createdAt || comment.date)
  ].join("|")

  return "comment-" + (postId || "unknown") + "-" + hashString(seed)
}

function normalizeNumber(value, defaultValue) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return defaultValue
  }

  return number
}

function normalizeComment(comment, post) {
  const source = comment || {}
  const author = source.author || (post && post.author) || "匿名用户"
  const date = source.date || source.createdAt || (post && post.date) || ""

  return {
    commentId: source.commentId !== undefined && source.commentId !== null
      ? source.commentId
      : createCommentId(source, post),
    postId: source.postId !== undefined && source.postId !== null
      ? source.postId
      : post && post.postId,
    authorId: source.authorId || getStableAuthorId(author, post),
    author: author,
    avatar: source.avatar || (post && post.avatar) || DEFAULT_AVATAR,
    content: source.content || "",
    createdAt: source.createdAt || date,
    date: date,
    parentCommentId: source.parentCommentId === undefined ? null : source.parentCommentId,
    rootCommentId: source.rootCommentId === undefined ? null : source.rootCommentId,
    level: normalizeNumber(source.level, 1),
    likeCount: normalizeNumber(source.likeCount, 0),
    dislikeCount: normalizeNumber(source.dislikeCount, 0),
    isLiked: Boolean(source.isLiked),
    isDisliked: Boolean(source.isDisliked),
    status: source.status || "active"
  }
}

function getCommentKey(comment) {
  return String(comment.postId) + "::" + String(comment.commentId)
}

function migrateCommentsFromPosts(posts) {
  const sourcePosts = Array.isArray(posts) ? posts : []
  const result = []
  const seen = {}

  sourcePosts.forEach(post => {
    const postComments = Array.isArray(post && post.comments) ? post.comments : []

    postComments.forEach(comment => {
      const safeComment = normalizeComment(comment, post)
      const key = getCommentKey(safeComment)

      if (!seen[key]) {
        seen[key] = true
        result.push(safeComment)
      }
    })
  })

  return result
}

function saveComments(comments) {
  const sourceComments = Array.isArray(comments) ? comments : []
  const result = []
  const seen = {}

  sourceComments.forEach(comment => {
    const safeComment = normalizeComment(comment)
    const key = getCommentKey(safeComment)

    if (!seen[key]) {
      seen[key] = true
      result.push(safeComment)
    }
  })

  wx.setStorageSync(COMMENTS_STORAGE_KEY, result)

  return result
}

function getComments() {
  const storageComments = wx.getStorageSync(COMMENTS_STORAGE_KEY)

  if (Array.isArray(storageComments)) {
    return saveComments(storageComments)
  }

  const migratedComments = migrateCommentsFromPosts(forumStore.getPosts())

  wx.setStorageSync(COMMENTS_STORAGE_KEY, migratedComments)

  return migratedComments
}

function isSamePostId(left, right) {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber === rightNumber
  }

  return String(left) === String(right)
}

function getCommentsByPostId(postId) {
  return getComments().filter(comment => isSamePostId(comment.postId, postId))
}

function isActiveComment(comment) {
  return !comment.status || comment.status === "active"
}

function getCommentCountByPostId(postId) {
  return getCommentsByPostId(postId).filter(isActiveComment).length
}

module.exports = {
  getComments,
  saveComments,
  getCommentsByPostId,
  migrateCommentsFromPosts,
  normalizeComment,
  getCommentCountByPostId
}
