const forumData = require("../data/forum-data.js")
const mockComments = require("./mock-comments.js")
const mockUsers = require("./mock-users.js")
const userStore = require("./user-store.js")

const POSTS_STORAGE_KEY = "forum_posts"
const MY_POSTS_STORAGE_KEY = "forum_my_posts"

const postDefaults = {
  view: 0,
  like: 0,
  collect: 0,
  commentCount: 0,
  isLiked: false,
  isCollected: false,
  isMine: false,
  comments: [],
  postImg: ""
}

function getStoragePosts() {
  const posts = wx.getStorageSync(POSTS_STORAGE_KEY)

  if (Array.isArray(posts) && posts.length > 0) {
    return posts
  }

  return forumData.postList || []
}

function normalizePostFields(post) {
  const safePost = Object.assign({}, postDefaults, post || {})

  if (!Array.isArray(safePost.comments)) {
    safePost.comments = []
  }

  if (safePost.commentCount === undefined || safePost.commentCount === null) {
    safePost.commentCount = safePost.comments.length
  }

  return safePost
}

function normalizePostData(posts) {
  const sourcePosts = Array.isArray(posts) ? posts : []
  const safePosts = sourcePosts.map(normalizePostFields)
  const postsWithComments = mockComments.fillMockComments(safePosts).map(normalizePostFields)

  const result = mockUsers.fillMockUsers(postsWithComments)

  userStore.ensureUsersFromPosts(result.posts)

  return result
}

function normalizePost(post) {
  const result = normalizePostData([post])

  return result.posts[0] || normalizePostFields(post)
}

function savePosts(posts) {
  const result = normalizePostData(posts)

  wx.setStorageSync(POSTS_STORAGE_KEY, result.posts)

  return result.posts
}

function getPostData() {
  const result = normalizePostData(getStoragePosts())

  wx.setStorageSync(POSTS_STORAGE_KEY, result.posts)

  return result
}

function getPosts() {
  return getPostData().posts
}

function isSamePostId(left, right) {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber === rightNumber
  }

  return String(left) === String(right)
}

function findPostById(postId) {
  const posts = getPosts()

  return posts.find(item => isSamePostId(item.postId, postId)) || null
}

function updatePostById(postId, updater) {
  const posts = getPosts()
  const index = posts.findIndex(item => isSamePostId(item.postId, postId))

  if (index === -1) {
    return null
  }

  const draft = Object.assign({}, posts[index])
  const nextPost = typeof updater === "function" ? updater(draft) : updater

  posts[index] = normalizePost(nextPost || draft)

  return savePosts(posts)[index]
}

function addPost(post) {
  const posts = getPosts()
  const nextPosts = [normalizePost(post)].concat(posts)

  return savePosts(nextPosts)[0]
}

function getMyPostIds() {
  const myPostIds = wx.getStorageSync(MY_POSTS_STORAGE_KEY)

  return Array.isArray(myPostIds) ? myPostIds : []
}

function addMyPostId(postId) {
  const myPostIds = getMyPostIds().filter(item => item !== postId)
  const nextMyPostIds = [postId].concat(myPostIds)

  wx.setStorageSync(MY_POSTS_STORAGE_KEY, nextMyPostIds)

  return nextMyPostIds
}

module.exports = {
  getPosts,
  getPostData,
  savePosts,
  findPostById,
  updatePostById,
  addPost,
  getMyPostIds,
  addMyPostId,
  normalizePost
}
