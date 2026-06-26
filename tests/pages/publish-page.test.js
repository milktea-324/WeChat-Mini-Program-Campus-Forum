const assert = require("assert")
const path = require("path")

const publishPagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "publish", "publish.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function clearModules() {
  ;[
    publishPagePath,
    forumStorePath,
    userStorePath
  ].forEach(filePath => {
    try {
      delete require.cache[require.resolve(filePath)]
    } catch (error) {}
  })
}

function loadPublishPage(options) {
  clearModules()

  const config = options || {}
  const calls = []
  const addedPosts = []
  const myPostIds = []
  let pageDefinition = null
  const originalSetTimeout = global.setTimeout

  global.Page = function(definition) {
    pageDefinition = definition
  }

  global.setTimeout = function(callback) {
    callback()
    return 1
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
    switchTab(options) {
      calls.push({ type: "switchTab", options })
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

  const forumStore = require(forumStorePath)

  forumStore.addPost = function(post) {
    addedPosts.push(post)
    return post
  }

  forumStore.addMyPostId = function(postId) {
    myPostIds.push(postId)
    return myPostIds.slice()
  }

  require(publishPagePath)

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

  return {
    page,
    calls,
    addedPosts,
    myPostIds,
    restore() {
      global.setTimeout = originalSetTimeout
    }
  }
}

let context = loadPublishPage({
  currentUser: {
    userId: "student-current",
    nickname: "\u6d4b\u8bd5\u540c\u5b66",
    avatar: "/images/avatar/12.png"
  }
})

context.page.setData({
  title: "\u65b0\u5e16\u6807\u9898",
  content: "\u65b0\u5e16\u5185\u5bb9",
  categoryNames: ["\u6821\u56ed\u751f\u6d3b"],
  categoryIndex: 0
})
context.page.onSubmit()

let post = context.addedPosts[0]

assert.ok(post)
assert.strictEqual(post.authorId, "student-current")
assert.strictEqual(post.author, "\u6d4b\u8bd5\u540c\u5b66")
assert.strictEqual(post.avatar, "/images/avatar/12.png")
assert.strictEqual(post.isMine, true)
assert.deepStrictEqual(post.comments, [])
assert.strictEqual(context.myPostIds[0], post.postId)
assert.deepStrictEqual(context.calls[context.calls.length - 1], {
  type: "switchTab",
  options: { url: "/pages/index/index" }
})
context.restore()

context = loadPublishPage({
  currentUserError: true
})

context.page.setData({
  title: "\u515c\u5e95\u65b0\u5e16",
  content: "\u515c\u5e95\u5185\u5bb9",
  categoryNames: ["\u6821\u56ed\u751f\u6d3b"],
  categoryIndex: 0
})
context.page.onSubmit()

post = context.addedPosts[0]

assert.strictEqual(post.authorId, "current-user")
assert.strictEqual(post.author, "\u5f53\u524d\u7528\u6237")
assert.strictEqual(post.avatar, "/images/avatar/default.png")
assert.strictEqual(post.isMine, true)
context.restore()

console.log("publish-page tests passed")
