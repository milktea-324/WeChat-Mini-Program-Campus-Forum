const assert = require("assert")
const path = require("path")

const indexPagePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "pages", "index", "index.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")
const postServicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "post-service.js")
const postFilterPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "post-filter.js")
const profileNavPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "profile-nav.js")
const routeNavPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "route-nav.js")

const CATEGORY_STUDY = "\u5b66\u4e60\u4ea4\u6d41"
const CATEGORY_LIFE = "\u6821\u56ed\u751f\u6d3b"
const CATEGORY_TRADE = "\u4e8c\u624b\u4ea4\u6613"

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function clearModules() {
  ;[
    indexPagePath,
    forumStorePath,
    userStorePath,
    postServicePath,
    postFilterPath,
    profileNavPath,
    routeNavPath
  ].forEach(filePath => {
    try {
      delete require.cache[require.resolve(filePath)]
    } catch (error) {}
  })
}

function createPosts() {
  return [
    {
      postId: "hot",
      title: "Hot study post",
      content: "Study content",
      authorId: "user-hot",
      author: "Legacy Hot",
      avatar: "/images/avatar/hot-legacy.png",
      authorInfo: {
        userId: "user-hot",
        nickname: "Legacy Hot",
        avatar: "/images/avatar/hot-legacy.png"
      },
      category: CATEGORY_STUDY,
      postImg: "/images/post/hot.png",
      date: "2026-06-10",
      view: 100,
      like: 10,
      collect: 2,
      commentCount: 3,
      isLiked: true,
      isCollected: false
    },
    {
      postId: "new-study",
      title: "\u82f1\u8bed\u89d2\u62db\u52df",
      content: "\u641c\u7d22\u5173\u952e\u8bcd\u5728\u8fd9\u91cc",
      authorId: "user-new",
      author: "Legacy New",
      avatar: "/images/avatar/new-legacy.png",
      authorInfo: {
        userId: "user-new",
        nickname: "Legacy New",
        avatar: "/images/avatar/new-legacy.png"
      },
      category: CATEGORY_STUDY,
      postImg: "",
      date: "2026-06-20",
      view: 20,
      like: 5,
      collect: 0,
      commentCount: 0,
      isLiked: false,
      isCollected: true
    },
    {
      postId: "life",
      title: "Life post",
      content: "Life content",
      authorId: "user-life",
      author: "Legacy Life",
      avatar: "/images/avatar/life-legacy.png",
      authorInfo: {
        userId: "user-life",
        nickname: "Legacy Life",
        avatar: "/images/avatar/life-legacy.png"
      },
      category: CATEGORY_LIFE,
      postImg: "",
      date: "2026-06-18",
      view: 1,
      like: 0,
      collect: 0,
      commentCount: 0,
      isLiked: false,
      isCollected: false
    },
    {
      postId: "trade",
      title: "Trade post",
      content: "Trade content",
      authorId: "user-trade",
      author: "Legacy Trade",
      avatar: "/images/avatar/trade-legacy.png",
      authorInfo: {
        userId: "user-trade",
        nickname: "Legacy Trade",
        avatar: "/images/avatar/trade-legacy.png"
      },
      category: CATEGORY_TRADE,
      postImg: "",
      date: "2026-06-01",
      view: 2,
      like: 0,
      collect: 0,
      commentCount: 0,
      isLiked: false,
      isCollected: false
    }
  ]
}

function loadIndexPage(posts) {
  clearModules()

  const calls = []
  const storage = {
    forum_users: [
      {
        userId: "user-hot",
        nickname: "Hot User",
        avatar: "/images/avatar/hot-user.png"
      },
      {
        userId: "user-new",
        nickname: "New User",
        avatar: "/images/avatar/new-user.png"
      },
      {
        userId: "user-life",
        nickname: "Life User",
        avatar: "/images/avatar/life-user.png"
      },
      {
        userId: "user-trade",
        nickname: "Trade User",
        avatar: "/images/avatar/trade-user.png"
      }
    ],
    forum_current_user: {
      userId: "user-hot"
    }
  }
  let pageDefinition = null

  global.Page = function(definition) {
    pageDefinition = definition
  }

  global.getCurrentPages = function() {
    return [{
      route: "pages/index/index",
      options: {}
    }]
  }

  global.wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
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
    switchTab(options) {
      calls.push({ type: "switchTab", options })
    }
  }

  const forumStore = require(forumStorePath)

  forumStore.getPosts = function() {
    return clone(posts)
  }

  require(indexPagePath)

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
    storage
  }
}

const context = loadIndexPage(createPosts())
const page = context.page

page.onLoad()
page.onShow()

assert.strictEqual(typeof page.data.postList[0].author, "string")
assert.strictEqual(typeof page.data.postList[0].category, "string")
assert.strictEqual(typeof page.data.showPostList[0].author, "object")
assert.strictEqual(typeof page.data.showPostList[0].category, "object")
assert.strictEqual(page.data.showPostList[0].authorName, "Hot User")
assert.strictEqual(page.data.showPostList[0].displayAuthorName, "Hot User")
assert.strictEqual(page.data.showPostList[0].displayCategoryName, CATEGORY_STUDY)
assert.strictEqual(page.data.showPostList[0].displayCoverUrl, "/images/post/hot.png")
assert.strictEqual(page.data.showPostList[0].displayLikeCount, 10)
assert.deepStrictEqual(page.data.bannerList.map(item => item.postId), ["hot", "new-study", "trade"])
assert.strictEqual(typeof page.data.bannerList[0].author, "object")
assert.strictEqual(page.data.bannerList[0].displayViewCount, 100)

page.onTapCategory({
  currentTarget: {
    dataset: {
      category: CATEGORY_STUDY
    }
  }
})

assert.strictEqual(page.data.postList.length, 4)
assert.strictEqual(typeof page.data.postList[0].category, "string")
assert.deepStrictEqual(page.data.showPostList.map(item => item.postId), ["hot", "new-study"])
assert.strictEqual(page.data.showPostList[0].category.name, CATEGORY_STUDY)

page.onSearchInput({
  detail: {
    value: "\u82f1\u8bed"
  }
})

assert.deepStrictEqual(page.data.showPostList.map(item => item.postId), ["new-study"])
assert.strictEqual(typeof page.data.showPostList[0].author, "object")

page.onSearchInput({
  detail: {
    value: ""
  }
})
page.onSortChange({
  detail: {
    value: 2
  }
})

assert.deepStrictEqual(page.data.showPostList.map(item => item.postId), ["hot", "new-study"])

page.onTapPost({
  currentTarget: {
    dataset: {
      postId: "hot"
    }
  }
})

assert.deepStrictEqual(context.calls[context.calls.length - 1], {
  type: "navigateTo",
  options: {
    url: "/pages/detail/detail?postId=hot"
  }
})

page.onTapAuthor({
  currentTarget: {
    dataset: {
      authorId: "user-new",
      authorName: "New User",
      avatar: "/images/avatar/new-user.png"
    }
  }
})

assert.deepStrictEqual(context.calls[context.calls.length - 1], {
  type: "navigateTo",
  options: {
    url: "/pages/user/user?authorId=user-new&nickname=New%20User&avatar=%2Fimages%2Favatar%2Fnew-user.png"
  }
})

console.log("index-page tests passed")
