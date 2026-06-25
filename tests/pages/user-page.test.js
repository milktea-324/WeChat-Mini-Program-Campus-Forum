const assert = require("assert")
const path = require("path")

const userPagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "user", "user.js")

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadUserPage(storage) {
  delete require.cache[require.resolve(userPagePath)]

  const calls = []
  const data = storage || {}
  let pageDefinition = null

  global.Page = function(definition) {
    pageDefinition = definition
  }

  global.getCurrentPages = function() {
    return []
  }

  global.wx = {
    getStorageSync(key) {
      return data[key]
    },
    setStorageSync(key, value) {
      data[key] = value
    },
    setNavigationBarTitle(options) {
      calls.push({ type: "setNavigationBarTitle", options })
    },
    showToast(options) {
      calls.push({ type: "showToast", options })
    },
    navigateBack(options) {
      calls.push({ type: "navigateBack", options })
    },
    switchTab(options) {
      calls.push({ type: "switchTab", options })
    }
  }

  require(userPagePath)

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
    storage: data
  }
}

let context = loadUserPage()

context.page.onLoad({
  authorId: "current-user"
})

assert.deepStrictEqual(context.calls, [{
  type: "switchTab",
  options: { url: "/pages/mine/mine" }
}])
assert.strictEqual(context.page.data.user, null)

context = loadUserPage()

context.page.onLoad({
  authorId: "comment-author-abc",
  nickname: "%E8%AF%84%E8%AE%BA%E5%90%8C%E5%AD%A6",
  avatar: "%2Fimages%2Favatar%2F7.png"
})

assert.strictEqual(context.page.data.authorId, "comment-author-abc")
assert.strictEqual(context.page.data.user.nickname, "评论同学")
assert.strictEqual(context.page.data.user.avatar, "/images/avatar/7.png")
assert.strictEqual(context.page.data.user.stats.postCount, 0)
assert.deepStrictEqual(context.page.data.authorPosts, [])
assert.strictEqual(context.page.data.emptyText, "TA 还没有发布帖子")
assert.deepStrictEqual(context.calls.find(call => call.type === "setNavigationBarTitle"), {
  type: "setNavigationBarTitle",
  options: { title: "评论同学" }
})

console.log("user-page tests passed")
