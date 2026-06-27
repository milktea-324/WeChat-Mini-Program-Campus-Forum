const assert = require("assert")
const path = require("path")

const servicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "post-service.js")
const postFilter = require("../../\u6821\u56ed\u8bba\u575b/utils/post-filter.js")

const {
  buildPostCardView,
  getPostCardView,
  getPostCardViews,
  getHotPostCardViews
} = require(servicePath)

const CATEGORY_STUDY = "\u5b66\u4e60\u4ea4\u6d41"
const CATEGORY_LIFE = "\u6821\u56ed\u751f\u6d3b"
const CURRENT_USER_ID = "current-user"

function createContext(overrides) {
  return Object.assign({
    users: [
      {
        userId: "user-1",
        nickname: "User One",
        avatar: "/images/avatar/user-one.png",
        roleName: "Student"
      },
      {
        userId: CURRENT_USER_ID,
        nickname: "Current User",
        avatar: "/images/avatar/current.png",
        roleName: "Student"
      }
    ],
    categories: [
      {
        id: 1,
        name: CATEGORY_STUDY,
        icon: "book",
        color: "#2f6fed"
      },
      {
        id: 2,
        name: CATEGORY_LIFE,
        icon: "home",
        color: "#2f9e44"
      }
    ],
    currentUser: {
      userId: "user-1"
    }
  }, overrides || {})
}

function createPost(overrides) {
  return Object.assign({
    postId: "post-1",
    title: "Campus post",
    content: "This   is a long campus post body that should be normalized before it becomes a compact card summary for list rendering.",
    authorId: "user-1",
    author: "Legacy Author",
    avatar: "/images/avatar/legacy.png",
    authorInfo: {
      userId: "user-1",
      nickname: "Info Author",
      avatar: "/images/avatar/info.png",
      roleName: "Info Role"
    },
    category: CATEGORY_STUDY,
    postImg: "/images/post/cover.png",
    date: "2026-06-01",
    view: 10,
    like: 3,
    collect: 2,
    commentCount: 4,
    isLiked: true,
    isCollected: true,
    isMine: false,
    comments: []
  }, overrides || {})
}

let post = createPost()
let view = buildPostCardView(post, createContext())

assert.strictEqual(view.postId, "post-1")
assert.strictEqual(view.title, "Campus post")
assert.ok(view.summary)
assert.ok(view.summary.length <= 83)
assert.ok(!/\s{2,}/.test(view.summary))
assert.ok(view.summary.endsWith("..."))

assert.deepStrictEqual(view.author, {
  userId: "user-1",
  nickname: "User One",
  avatar: "/images/avatar/user-one.png",
  roleName: "Student"
})
assert.strictEqual(typeof view.author, "object")
assert.strictEqual(view.author.nickname, "User One")
assert.deepStrictEqual(view.category, {
  categoryId: 1,
  name: CATEGORY_STUDY,
  icon: "book",
  color: "#2f6fed"
})
assert.strictEqual(typeof view.category, "object")
assert.strictEqual(view.category.name, CATEGORY_STUDY)
assert.ok(view.coverMedia)
assert.strictEqual(view.coverMedia.mediaId, "post-post-1-cover")
assert.strictEqual(view.coverMedia.type, "image")
assert.strictEqual(view.coverMedia.usageType, "cover")
assert.strictEqual(view.coverMedia.displayUrl, "/images/post/cover.png")
assert.strictEqual(view.authorName, "User One")
assert.strictEqual(view.categoryName, CATEGORY_STUDY)
assert.strictEqual(view.authorAvatar, "/images/avatar/user-one.png")
assert.strictEqual(view.coverUrl, "/images/post/cover.png")

assert.deepStrictEqual(view.stats, {
  viewCount: 10,
  likeCount: 3,
  dislikeCount: 0,
  collectCount: 2,
  commentCount: 4,
  hotScore: postFilter.getHeat(post)
})
assert.deepStrictEqual(view.currentUserState, {
  reaction: "like",
  isLiked: true,
  isDisliked: false,
  isCollected: true,
  isMine: true,
  canEdit: true,
  canDelete: true
})
assert.strictEqual(view.status, "active")
assert.strictEqual(view.visibility, "public")
assert.strictEqual(view.createdAt, "2026-06-01")
assert.strictEqual(view.updatedAt, "2026-06-01")
assert.strictEqual(view.displayTime, "2026-06-01")

assert.strictEqual(view.authorId, "user-1")
assert.strictEqual(view.avatar, "/images/avatar/legacy.png")
assert.strictEqual(view.authorInfo.userId, "user-1")
assert.strictEqual(view.categoryName, CATEGORY_STUDY)
assert.strictEqual(view.postImg, "/images/post/cover.png")
assert.strictEqual(view.date, "2026-06-01")
assert.strictEqual(view.view, 10)
assert.strictEqual(view.like, 3)
assert.strictEqual(view.collect, 2)
assert.strictEqual(view.commentCount, 4)
assert.strictEqual(view.isLiked, true)
assert.strictEqual(view.isCollected, true)
assert.strictEqual(view.isMine, true)
assert.strictEqual(view.content, post.content)
assert.strictEqual(view.legacy.author, "Legacy Author")
assert.strictEqual(view.legacy.category, CATEGORY_STUDY)
assert.strictEqual(view._debug, undefined)
assert.strictEqual(post.authorName, undefined)
assert.strictEqual(post.categoryName, undefined)
assert.strictEqual(post.authorAvatar, undefined)
assert.strictEqual(post.coverUrl, undefined)

view = buildPostCardView(createPost({
  postId: "post-no-cover",
  postImg: ""
}), createContext())

assert.strictEqual(view.coverMedia, null)
assert.strictEqual(view.coverUrl, "")

const sourcePosts = [
  createPost({
    postId: "low",
    view: 1,
    like: 0,
    collect: 0,
    commentCount: 0,
    postImg: ""
  }),
  createPost({
    postId: "high",
    view: 10,
    like: 10,
    collect: 10,
    commentCount: 10,
    postImg: ""
  }),
  createPost({
    postId: "mid",
    view: 5,
    like: 2,
    collect: 1,
    commentCount: 1,
    postImg: ""
  })
]
const beforePosts = JSON.stringify(sourcePosts)
const cardViews = getPostCardViews(createContext({
  posts: sourcePosts
}))

assert.strictEqual(cardViews.length, 3)
assert.deepStrictEqual(cardViews.map(item => item.postId), ["low", "high", "mid"])
assert.strictEqual(JSON.stringify(sourcePosts), beforePosts)

const singleCardView = getPostCardView("high", createContext({
  posts: sourcePosts
}))

assert.ok(singleCardView)
assert.strictEqual(singleCardView.postId, "high")

const hotViews = getHotPostCardViews(2, createContext({
  posts: sourcePosts
}))

assert.strictEqual(hotViews.length, 2)
assert.deepStrictEqual(hotViews.map(item => item.postId), ["high", "mid"])
assert.ok(hotViews[0].stats.hotScore >= hotViews[1].stats.hotScore)

const fallbackView = buildPostCardView({
  postId: "fallback",
  title: "Fallback post",
  content: "Fallback content"
}, createContext({
  users: [],
  categories: [],
  currentUser: {
    userId: CURRENT_USER_ID
  }
}))

assert.strictEqual(fallbackView.author.userId, "")
assert.ok(fallbackView.author.nickname)
assert.strictEqual(fallbackView.author.avatar, "/images/avatar/default.png")
assert.strictEqual(fallbackView.category.categoryId, null)
assert.ok(fallbackView.category.name)
assert.strictEqual(fallbackView.coverMedia, null)
assert.strictEqual(fallbackView.authorName, "校园用户")
assert.strictEqual(fallbackView.categoryName, "未分类")
assert.strictEqual(fallbackView.authorAvatar, "/images/avatar/default.png")
assert.strictEqual(fallbackView.coverUrl, "")

console.log("post-service tests passed")
