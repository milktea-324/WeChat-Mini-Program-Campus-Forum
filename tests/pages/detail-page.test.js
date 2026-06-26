const assert = require("assert")
const path = require("path")

const detailPagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "detail", "detail.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const commentStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-store.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")
const profileNavPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "profile-nav.js")

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function clearModules() {
  ;[
    detailPagePath,
    forumStorePath,
    commentStorePath,
    userStorePath,
    profileNavPath
  ].forEach(filePath => {
    try {
      delete require.cache[require.resolve(filePath)]
    } catch (error) {}
  })
}

function loadDetailPage(options) {
  clearModules()

  const config = options || {}
  const calls = []
  const addedComments = []
  const basePost = {
    postId: 21,
    title: "\u53ef\u8bc4\u8bba\u5e16\u5b50",
    authorId: "post-author",
    author: "\u697c\u4e3b",
    avatar: "/images/avatar/1.png",
    comments: [],
    commentCount: 0
  }
  let pageDefinition = null

  global.Page = function(definition) {
    pageDefinition = definition
  }

  global.getCurrentPages = function() {
    return []
  }

  global.wx = {
    getStorageSync(key) {
      return config.storage && config.storage[key]
    },
    setStorageSync(key, value) {
      if (config.storage) {
        config.storage[key] = value
      }
    },
    showToast(options) {
      calls.push({ type: "showToast", options })
    },
    navigateBack(options) {
      calls.push({ type: "navigateBack", options })
    }
  }

  const userStore = require(userStorePath)

  if (config.currentUserError) {
    userStore.getCurrentUser = function() {
      throw new Error("current user unavailable")
    }
  } else {
    userStore.getCurrentUser = function() {
      return config.currentUser
    }
  }

  const commentStore = require(commentStorePath)

  commentStore.addComment = function(comment) {
    addedComments.push(comment)
    return comment
  }

  commentStore.getCommentsByPostId = function() {
    return addedComments.slice()
  }

  commentStore.getCommentCountByPostId = function() {
    return addedComments.length
  }

  const forumStore = require(forumStorePath)

  forumStore.updatePostById = function(postId, updater) {
    if (typeof updater === "function") {
      return updater(basePost)
    }

    return updater || basePost
  }

  forumStore.findPostById = function() {
    return basePost
  }

  require(detailPagePath)

  const page = {
    data: clone(pageDefinition.data),
    setData(update) {
      this.data = Object.assign({}, this.data, update)
    }
  }

  Object.keys(pageDefinition).forEach(key => {
    if (typeof pageDefinition[key] === "function") {
      page[key] = pageDefinition[key]
    }
  })

  page.setData({
    postId: basePost.postId,
    post: basePost,
    commentText: "\u65b0\u589e\u8bc4\u8bba"
  })

  return {
    page,
    calls,
    addedComments
  }
}

let context = loadDetailPage({
  currentUser: {
    userId: "student-current",
    nickname: "\u6d4b\u8bd5\u540c\u5b66",
    avatar: "/images/avatar/12.png"
  }
})

context.page.onSubmitComment()

let comment = context.addedComments[0]

assert.ok(comment)
assert.strictEqual(comment.authorId, "student-current")
assert.strictEqual(comment.author, "\u6d4b\u8bd5\u540c\u5b66")
assert.strictEqual(comment.avatar, "/images/avatar/12.png")
assert.strictEqual(comment.content, "\u65b0\u589e\u8bc4\u8bba")
assert.strictEqual(comment.parentCommentId, null)
assert.strictEqual(comment.rootCommentId, null)
assert.strictEqual(comment.level, 1)
assert.strictEqual(comment.likeCount, 0)
assert.strictEqual(comment.dislikeCount, 0)
assert.strictEqual(comment.isLiked, false)
assert.strictEqual(comment.isDisliked, false)
assert.strictEqual(comment.status, "active")
assert.strictEqual(context.page.data.commentText, "")

context = loadDetailPage({
  currentUserError: true
})

context.page.onSubmitComment()
comment = context.addedComments[0]

assert.strictEqual(comment.authorId, "current-user")
assert.strictEqual(comment.author, "\u5f53\u524d\u7528\u6237")
assert.strictEqual(comment.avatar, "/images/avatar/default.png")

console.log("detail-page tests passed")
