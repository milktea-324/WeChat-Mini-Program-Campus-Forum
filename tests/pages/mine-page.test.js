const assert = require("assert")
const path = require("path")

const minePagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "mine", "mine.js")
const commentStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-store.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const profileServicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "profile-service.js")
const postServicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "post-service.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadMinePage(storage, options) {
  delete require.cache[require.resolve(minePagePath)]
  delete require.cache[require.resolve(commentStorePath)]
  delete require.cache[require.resolve(forumStorePath)]
  delete require.cache[require.resolve(profileServicePath)]
  delete require.cache[require.resolve(postServicePath)]
  delete require.cache[require.resolve(userStorePath)]

  const config = options || {}
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
    navigateTo(options) {
      calls.push({ type: "navigateTo", options })
    },
    redirectTo(options) {
      calls.push({ type: "redirectTo", options })
    },
    navigateBack(options) {
      calls.push({ type: "navigateBack", options })
    },
    showToast(options) {
      calls.push({ type: "showToast", options })
    }
  }

  const userStore = require(userStorePath)

  if (config.currentUserError) {
    userStore.getCurrentUser = function() {
      throw new Error("current user unavailable")
    }
    userStore.getCurrentUserRef = function() {
      throw new Error("current user ref unavailable")
    }
  }

  require(minePagePath)

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

const context = loadMinePage({
  forum_users: [
    {
      userId: "student-current",
      nickname: "\u6d4b\u8bd5\u540c\u5b66",
      avatar: "/images/avatar/12.png"
    }
  ],
  forum_current_user: {
    userId: "student-current"
  },
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
    },
    {
      postId: 11,
      title: "\u6211\u7684\u53d1\u5e03",
      author: "\u6d4b\u8bd5\u540c\u5b66",
      authorId: "student-current",
      avatar: "/images/avatar/12.png",
      category: "\u5b66\u4e60\u4ea4\u6d41",
      date: "2026-06-20",
      view: 6,
      like: 2,
      collect: 1,
      isMine: true,
      commentCount: 0,
      comments: []
    },
    {
      postId: 12,
      title: "\u6211\u7684\u6536\u85cf",
      author: "妤间富",
      authorId: "user-post-author",
      avatar: "/images/avatar/1.png",
      category: "\u6821\u56ed\u751f\u6d3b",
      date: "2026-06-20",
      isCollected: true,
      commentCount: 0,
      comments: []
    },
    {
      postId: 13,
      title: "\u6211\u7684\u70b9\u8d5e",
      author: "妤间富",
      authorId: "user-post-author",
      avatar: "/images/avatar/1.png",
      category: "\u6821\u56ed\u751f\u6d3b",
      date: "2026-06-20",
      isLiked: true,
      commentCount: 0,
      comments: []
    }
  ],
  forum_comments: [
    {
      commentId: "c1",
      postId: 10,
      authorId: "current-user",
      author: "当前用户",
      avatar: "/images/avatar/default.png",
      content: "我写过的评论",
      date: "2026-06-21",
      status: "active"
    },
    {
      commentId: "c2",
      postId: 999,
      author: "当前用户",
      avatar: "/images/avatar/default.png",
      content: "原帖不见了",
      date: "2026-06-22",
      status: "active"
    },
    {
      commentId: "c3",
      postId: 10,
      authorId: "other-user",
      author: "其他同学",
      content: "不属于当前用户",
      date: "2026-06-23",
      status: "active"
    }
  ]
})

context.page.onLoad()
context.page.onShow()

assert.strictEqual(context.page.data.user.nickname, "\u6d4b\u8bd5\u540c\u5b66")
assert.strictEqual(context.page.data.user.avatar, "/images/avatar/12.png")
assert.strictEqual(context.page.data.currentTab, "published")
assert.strictEqual(context.page.data.myPostList.length, 1)
assert.strictEqual(context.page.data.collectList.length, 1)
assert.strictEqual(context.page.data.likeList.length, 1)
assert.strictEqual(context.page.data.myCommentList.length, 2)
assert.strictEqual(context.page.data.myViewCount, 6)
assert.strictEqual(context.page.data.myLikeReceivedCount, 2)
assert.strictEqual(context.page.data.myCollectReceivedCount, 1)
assert.strictEqual(context.page.data.showList.length, 1)
assert.strictEqual(context.page.data.showList[0].postId, 11)
assert.strictEqual(typeof context.page.data.showList[0].author, "object")
assert.strictEqual(typeof context.page.data.showList[0].category, "object")
assert.strictEqual(context.page.data.showList[0].authorName, "\u6d4b\u8bd5\u540c\u5b66")
assert.strictEqual(context.page.data.showList[0].categoryName, "\u5b66\u4e60\u4ea4\u6d41")
assert.strictEqual(typeof context.page.data.myPostList[0].author, "string")
assert.strictEqual(typeof context.page.data.myPostList[0].category, "string")
assert.strictEqual(context.page.data.myCommentList[0].postTitle, "可查看帖子")
assert.strictEqual(context.page.data.myCommentList[0].postAvailable, true)
assert.strictEqual(context.page.data.myCommentList[1].postTitle, "原帖已不可用")
assert.strictEqual(context.page.data.myCommentList[1].postAvailable, false)

context.page.onSearchInput({
  detail: {
    value: "\u6211\u7684\u53d1\u5e03"
  }
})

assert.deepStrictEqual(context.page.data.showList.map(item => item.postId), [11])
assert.strictEqual(typeof context.page.data.showList[0].author, "object")
assert.strictEqual(typeof context.page.data.myPostList[0].author, "string")

context.page.onTapCategory({
  currentTarget: {
    dataset: {
      category: "\u5b66\u4e60\u4ea4\u6d41"
    }
  }
})

assert.deepStrictEqual(context.page.data.showList.map(item => item.postId), [11])

context.page.onTapCategory({
  currentTarget: {
    dataset: {
      category: "\u6821\u56ed\u751f\u6d3b"
    }
  }
})

assert.deepStrictEqual(context.page.data.showList.map(item => item.postId), [])

context.page.setData({
  keyword: "",
  currentCategory: context.page.data.categoryList[0].name
})
context.page.onSortChange({
  detail: {
    value: 0
  }
})

assert.deepStrictEqual(context.page.data.showList.map(item => item.postId), [11])

context.page.onChangeTab({
  currentTarget: {
    dataset: {
      tab: "collected"
    }
  }
})

assert.deepStrictEqual(context.page.data.showList.map(item => item.postId), [12])
assert.strictEqual(typeof context.page.data.showList[0].author, "object")
assert.strictEqual(typeof context.page.data.collectList[0].author, "string")

context.page.onChangeTab({
  currentTarget: {
    dataset: {
      tab: "liked"
    }
  }
})

assert.deepStrictEqual(context.page.data.showList.map(item => item.postId), [13])
assert.strictEqual(typeof context.page.data.showList[0].author, "object")
assert.strictEqual(typeof context.page.data.likeList[0].author, "string")

context.page.onChangeTab({
  currentTarget: {
    dataset: {
      tab: "comments"
    }
  }
})

assert.strictEqual(context.page.data.currentTab, "comments")
assert.strictEqual(context.page.data.emptyText, "还没有发表过评论")

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
    route: "pages/mine/mine",
    options: {}
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

const fallbackContext = loadMinePage({
  forum_posts: [],
  forum_comments: []
}, {
  currentUserError: true
})

fallbackContext.page.onLoad()
fallbackContext.page.onShow()

assert.strictEqual(fallbackContext.page.data.user.nickname, "\u5f53\u524d\u7528\u6237")
assert.strictEqual(fallbackContext.page.data.user.avatar, "/images/avatar/default.png")

console.log("mine-page tests passed")
