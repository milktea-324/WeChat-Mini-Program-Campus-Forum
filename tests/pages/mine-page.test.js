const assert = require("assert")
const path = require("path")

const minePagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "mine", "mine.js")
const commentStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-store.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadMinePage(storage) {
  delete require.cache[require.resolve(minePagePath)]
  delete require.cache[require.resolve(commentStorePath)]
  delete require.cache[require.resolve(forumStorePath)]

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

assert.strictEqual(context.page.data.currentTab, "published")
assert.strictEqual(context.page.data.myCommentList.length, 2)
assert.strictEqual(context.page.data.myCommentList[0].postTitle, "可查看帖子")
assert.strictEqual(context.page.data.myCommentList[0].postAvailable, true)
assert.strictEqual(context.page.data.myCommentList[1].postTitle, "原帖已不可用")
assert.strictEqual(context.page.data.myCommentList[1].postAvailable, false)

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

console.log("mine-page tests passed")
