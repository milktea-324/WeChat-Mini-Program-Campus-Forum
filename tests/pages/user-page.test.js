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
    },
    navigateTo(options) {
      calls.push({ type: "navigateTo", options })
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
assert.strictEqual(context.page.data.user.stats.commentCount, 0)
assert.deepStrictEqual(context.page.data.authorPosts, [])
assert.deepStrictEqual(context.page.data.authorComments, [])
assert.strictEqual(context.page.data.activeTab, "posts")
assert.strictEqual(context.page.data.emptyText, "TA 还没有发布帖子")
assert.deepStrictEqual(context.calls.find(call => call.type === "setNavigationBarTitle"), {
  type: "setNavigationBarTitle",
  options: { title: "评论同学" }
})

context = loadUserPage({
  forum_posts: [
    {
      postId: 10,
      title: "可查看帖子",
      author: "楼主",
      authorId: "user-post-author",
      avatar: "/images/avatar/1.png",
      date: "2026-06-20",
      commentCount: 0,
      comments: []
    }
  ],
  forum_comments: [
    {
      commentId: "c1",
      postId: 10,
      authorId: "comment-author-abc",
      author: "评论同学",
      avatar: "/images/avatar/7.png",
      content: "这是一条评论",
      date: "2026-06-21",
      status: "active"
    },
    {
      commentId: "c2",
      postId: 999,
      authorId: "legacy-author-id",
      author: "评论同学",
      avatar: "/images/avatar/7.png",
      content: "原帖不见了",
      date: "2026-06-22",
      status: "active"
    },
    {
      commentId: "c3",
      postId: 10,
      authorId: "other-user",
      author: "其他同学",
      content: "不属于该用户",
      date: "2026-06-23",
      status: "active"
    }
  ]
})

context.page.onLoad({
  authorId: "comment-author-abc",
  nickname: "%E8%AF%84%E8%AE%BA%E5%90%8C%E5%AD%A6",
  avatar: "%2Fimages%2Favatar%2F7.png"
})

assert.strictEqual(context.page.data.user.stats.postCount, 0)
assert.strictEqual(context.page.data.user.stats.commentCount, 2)
assert.strictEqual(context.page.data.authorComments.length, 2)
assert.strictEqual(context.page.data.authorComments[0].postTitle, "可查看帖子")
assert.strictEqual(context.page.data.authorComments[0].postAvailable, true)
assert.strictEqual(context.page.data.authorComments[1].postTitle, "原帖已不可用")
assert.strictEqual(context.page.data.authorComments[1].postAvailable, false)

context.page.onChangeTab({
  currentTarget: {
    dataset: {
      tab: "comments"
    }
  }
})

assert.strictEqual(context.page.data.activeTab, "comments")
assert.strictEqual(context.page.data.emptyText, "TA 还没有发表过评论")

context.page.onTapComment({
  currentTarget: {
    dataset: {
      postId: 10,
      available: true
    }
  }
})

assert.deepStrictEqual(context.calls[context.calls.length - 1], {
  type: "navigateTo",
  options: { url: "/pages/detail/detail?postId=10" }
})

context.page.onTapComment({
  currentTarget: {
    dataset: {
      postId: 999,
      available: false
    }
  }
})

assert.deepStrictEqual(context.calls[context.calls.length - 1], {
  type: "showToast",
  options: {
    title: "原帖已不可用",
    icon: "none"
  }
})

console.log("user-page tests passed")
