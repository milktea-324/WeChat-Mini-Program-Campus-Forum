const assert = require("assert")
const path = require("path")

const userPagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "user", "user.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const commentStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-store.js")
const profileServicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "profile-service.js")
const postServicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "post-service.js")

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadUserPage(storage) {
  delete require.cache[require.resolve(userPagePath)]
  delete require.cache[require.resolve(userStorePath)]
  delete require.cache[require.resolve(forumStorePath)]
  delete require.cache[require.resolve(commentStorePath)]
  delete require.cache[require.resolve(profileServicePath)]
  delete require.cache[require.resolve(postServicePath)]

  const calls = []
  const data = storage || {}
  let pages = []
  let pageDefinition = null

  global.Page = function(definition) {
    pageDefinition = definition
  }

  global.getCurrentPages = function() {
    return pages
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
    },
    redirectTo(options) {
      calls.push({ type: "redirectTo", options })
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
    storage: data,
    setPages(nextPages) {
      pages = nextPages || []
    }
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
  forum_users: [
    {
      userId: "user-post-author",
      nickname: "\u7528\u6237\u8868\u697c\u4e3b",
      avatar: "/images/avatar/user-store.png",
      bio: "\u6765\u81ea\u7528\u6237\u8868\u7684\u7b80\u4ecb",
      roleName: "\u793e\u56e2\u8d1f\u8d23\u4eba",
      department: "\u827a\u672f\u8bbe\u8ba1\u5b66\u9662",
      grade: "2023\u7ea7",
      tags: ["\u6444\u5f71", "\u6d3b\u52a8"]
    }
  ],
  forum_posts: [
    {
      postId: 10,
      title: "\u53ef\u67e5\u770b\u5e16\u5b50",
      author: "\u697c\u4e3b",
      authorId: "user-post-author",
      avatar: "/images/avatar/1.png",
      date: "2026-06-20",
      view: 5,
      like: 2,
      collect: 1,
      commentCount: 2,
      comments: []
    }
  ],
  forum_comments: [
    {
      commentId: "same-author-id-1",
      postId: 10,
      authorId: "user-post-author",
      author: "\u697c\u4e3b",
      avatar: "/images/avatar/1.png",
      content: "\u76ee\u6807\u4f5c\u8005\u7684\u8bc4\u8bba",
      date: "2026-06-21",
      status: "active"
    },
    {
      commentId: "same-author-id-2",
      postId: 999,
      authorId: "user-post-author",
      author: "\u7528\u6237\u8868\u697c\u4e3b",
      avatar: "/images/avatar/user-store.png",
      content: "\u540c authorId \u7684\u5386\u53f2\u8bc4\u8bba",
      date: "2026-06-22",
      status: "active"
    }
  ]
})

context.page.onLoad({
  authorId: "user-post-author",
  nickname: "%E6%A5%BC%E4%B8%BB",
  avatar: "%2Fimages%2Favatar%2F1.png"
})

assert.strictEqual(context.page.data.user.userId, "user-post-author")
assert.strictEqual(context.page.data.user.nickname, "\u697c\u4e3b")
assert.strictEqual(context.page.data.user.avatar, "/images/avatar/1.png")
assert.strictEqual(context.page.data.user.stats.postCount, 1)
assert.strictEqual(context.page.data.user.stats.viewCount, 5)
assert.strictEqual(context.page.data.user.stats.likeCount, 2)
assert.strictEqual(context.page.data.user.stats.collectCount, 1)
assert.strictEqual(context.page.data.user.stats.commentCount, 2)
assert.strictEqual(context.page.data.authorPosts.length, 1)
assert.strictEqual(context.page.data.authorPosts[0].authorId, "user-post-author")
assert.strictEqual(typeof context.page.data.authorPosts[0].author, "object")
assert.strictEqual(typeof context.page.data.authorPosts[0].category, "object")
assert.strictEqual(context.page.data.authorPosts[0].authorName, "\u697c\u4e3b")
assert.strictEqual(context.storage.forum_posts[0].author, "\u697c\u4e3b")
assert.strictEqual(context.page.data.authorComments.length, 2)
assert.ok(context.page.data.authorComments.every(comment => comment.authorId === "user-post-author"))
assert.strictEqual(context.page.data.authorComments[0].authorMatchReason, "authorId")
assert.strictEqual(context.page.data.authorComments[0].postTitle, "\u53ef\u67e5\u770b\u5e16\u5b50")
assert.strictEqual(context.page.data.authorComments[0].postAvailable, true)
assert.deepStrictEqual(context.calls.find(call => call.type === "setNavigationBarTitle"), {
  type: "setNavigationBarTitle",
  options: { title: "\u697c\u4e3b" }
})

context = loadUserPage({
  forum_posts: [
    {
      postId: 5,
      title: "\u5357\u98ce\u7684\u5e16\u5b50",
      author: "\u5357\u98ce",
      authorId: "user-f0if",
      avatar: "/images/avatar/5.png",
      date: "2026-06-05",
      view: 10,
      like: 4,
      collect: 2,
      commentCount: 1,
      comments: []
    }
  ],
  forum_comments: [
    {
      commentId: "old-shadow-nanfeng",
      postId: 5,
      authorId: "comment-author-f0if",
      author: "\u5357\u98ce",
      avatar: "/images/avatar/wrong.png",
      content: "\u65e7\u7f13\u5b58\u4e2d\u7684\u5357\u98ce\u8bc4\u8bba",
      date: "2026-06-22",
      status: "active"
    }
  ]
})

context.page.onLoad({
  authorId: "user-f0if",
  nickname: "%E5%8D%97%E9%A3%8E",
  avatar: "%2Fimages%2Favatar%2F5.png"
})

assert.strictEqual(context.page.data.user.userId, "user-f0if")
assert.strictEqual(context.page.data.user.nickname, "\u5357\u98ce")
assert.strictEqual(context.page.data.user.avatar, "/images/avatar/5.png")
assert.strictEqual(context.page.data.authorPosts.length, 1)
assert.strictEqual(context.page.data.authorPosts[0].authorId, "user-f0if")
assert.strictEqual(context.page.data.authorComments.length, 1)
assert.strictEqual(context.page.data.authorComments[0].authorId, "user-f0if")
assert.strictEqual(context.page.data.authorComments[0].avatar, "/images/avatar/5.png")
assert.strictEqual(context.page.data.user.stats.postCount, 1)
assert.strictEqual(context.page.data.user.stats.commentCount, 1)

context = loadUserPage({
  forum_users: [
    {
      userId: "comment-author-partial",
      nickname: "\u90e8\u5206\u8d44\u6599\u540c\u5b66",
      avatar: "",
      tags: ""
    }
  ],
  forum_posts: [],
  forum_comments: []
})

context.page.onLoad({
  authorId: "comment-author-partial"
})

assert.strictEqual(context.page.data.user.nickname, "\u90e8\u5206\u8d44\u6599\u540c\u5b66")
assert.strictEqual(context.page.data.user.avatar, "/images/avatar/default.png")
assert.ok(Array.isArray(context.page.data.user.tags))
assert.strictEqual(context.page.data.user.stats.postCount, 0)
assert.strictEqual(context.page.data.user.stats.commentCount, 0)

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
assert.strictEqual(context.page.data.authorComments[0].authorMatchReason, "authorId")
assert.strictEqual(context.page.data.authorComments[1].authorMatchReason, "nicknameFallback")

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

context.setPages([
  {
    route: "pages/detail/detail",
    options: { postId: "10" }
  },
  {
    route: "pages/user/user",
    options: { authorId: "comment-author-abc" }
  }
])

context.page.onTapPost({
  currentTarget: {
    dataset: {
      postId: 10
    }
  }
})

assert.deepStrictEqual(context.calls[context.calls.length - 1], {
  type: "navigateBack",
  options: { delta: 1 }
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
