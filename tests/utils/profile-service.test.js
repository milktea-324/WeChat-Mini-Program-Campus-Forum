const assert = require("assert")
const path = require("path")

const servicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "profile-service.js")
const {
  buildMineProfileView,
  buildUserProfileView,
  getMineProfileView,
  getUserProfileView,
  isCommentAuthoredByUser
} = require(servicePath)

const CATEGORY_STUDY = "\u5b66\u4e60\u4ea4\u6d41"
const CATEGORY_LIFE = "\u6821\u56ed\u751f\u6d3b"
const CURRENT_USER_ID = "user-current"
const TARGET_USER_ID = "user-target"

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createUsers() {
  return [
    {
      userId: CURRENT_USER_ID,
      nickname: "Current Student",
      avatar: "/images/avatar/current.png",
      bio: "Current bio",
      role: "student",
      roleName: "Student",
      department: "Computer School",
      grade: "2024",
      isCurrentUser: true
    },
    {
      userId: TARGET_USER_ID,
      nickname: "Target Student",
      avatar: "/images/avatar/target.png",
      bio: "Target bio",
      role: "student",
      roleName: "Club Lead",
      department: "Art School",
      grade: "2023"
    },
    {
      userId: "user-other",
      nickname: "Other Student",
      avatar: "/images/avatar/other.png"
    }
  ]
}

function createPosts() {
  return [
    {
      postId: "mine-1",
      title: "My first post",
      content: "My first post content",
      authorId: CURRENT_USER_ID,
      author: "Current Student",
      avatar: "/images/avatar/current.png",
      category: CATEGORY_STUDY,
      postImg: "/images/post/mine.png",
      date: "2026-06-01",
      view: 10,
      like: 2,
      collect: 1,
      commentCount: 1,
      isMine: true,
      isLiked: false,
      isCollected: false,
      comments: []
    },
    {
      postId: "manual-mine",
      title: "Manual mine post",
      content: "Manual mine content",
      authorId: "user-other",
      author: "Other Student",
      avatar: "/images/avatar/other.png",
      category: CATEGORY_LIFE,
      postImg: "",
      date: "2026-06-02",
      view: 5,
      like: 1,
      collect: 4,
      commentCount: 0,
      isMine: false,
      isLiked: false,
      isCollected: false,
      comments: []
    },
    {
      postId: "liked-1",
      title: "Liked post",
      content: "Liked post content",
      authorId: "user-other",
      author: "Other Student",
      avatar: "/images/avatar/other.png",
      category: CATEGORY_STUDY,
      postImg: "",
      date: "2026-06-03",
      view: 2,
      like: 9,
      collect: 0,
      commentCount: 0,
      isMine: false,
      isLiked: true,
      isCollected: false,
      comments: []
    },
    {
      postId: "collected-1",
      title: "Collected post",
      content: "Collected post content",
      authorId: "user-other",
      author: "Other Student",
      avatar: "/images/avatar/other.png",
      category: CATEGORY_LIFE,
      postImg: "",
      date: "2026-06-04",
      view: 3,
      like: 0,
      collect: 8,
      commentCount: 0,
      isMine: false,
      isLiked: false,
      isCollected: true,
      comments: []
    },
    {
      postId: "target-1",
      title: "Target post",
      content: "Target post content",
      authorId: TARGET_USER_ID,
      author: "Target Student",
      avatar: "/images/avatar/target.png",
      category: CATEGORY_STUDY,
      postImg: "/images/post/target.png",
      date: "2026-06-05",
      view: 7,
      like: 3,
      collect: 2,
      commentCount: 1,
      isMine: false,
      isLiked: false,
      isCollected: false,
      comments: []
    }
  ]
}

function createComments() {
  return [
    {
      commentId: "comment-current-1",
      postId: "mine-1",
      authorId: CURRENT_USER_ID,
      author: "Current Student",
      avatar: "/images/avatar/current.png",
      content: "Current comment",
      date: "2026-06-06",
      status: "active"
    },
    {
      commentId: "comment-current-missing",
      postId: "missing-post",
      authorId: CURRENT_USER_ID,
      author: "Current Student",
      avatar: "/images/avatar/current.png",
      content: "Current missing post comment",
      date: "2026-06-07",
      status: "active"
    },
    {
      commentId: "comment-current-legacy-id",
      postId: "mine-1",
      authorId: "current-user",
      author: "当前用户",
      avatar: "/images/avatar/default.png",
      content: "Current legacy id comment",
      date: "2026-06-07",
      status: "active"
    },
    {
      commentId: "comment-current-display-name",
      postId: "mine-1",
      author: "当前用户",
      avatar: "/images/avatar/default.png",
      content: "Current display name comment",
      date: "2026-06-07",
      status: "active"
    },
    {
      commentId: "comment-current-nickname",
      postId: "mine-1",
      authorId: "legacy-current-user",
      author: "Current Student",
      avatar: "/images/avatar/current.png",
      content: "Current nickname comment",
      date: "2026-06-07",
      status: "active"
    },
    {
      commentId: "comment-target-1",
      postId: "target-1",
      authorId: TARGET_USER_ID,
      author: "Target Student",
      avatar: "/images/avatar/target.png",
      content: "Target comment",
      date: "2026-06-08",
      status: "active"
    },
    {
      commentId: "comment-target-nickname",
      postId: "target-1",
      authorId: "legacy-target-user",
      author: "Target Student",
      avatar: "/images/avatar/target.png",
      content: "Target nickname comment",
      date: "2026-06-08",
      status: "active"
    },
    {
      commentId: "comment-known-other-same-name",
      postId: "target-1",
      authorId: "user-other",
      author: "Target Student",
      avatar: "/images/avatar/other.png",
      content: "Known other same name comment",
      date: "2026-06-08",
      status: "active"
    },
    {
      commentId: "comment-other",
      postId: "mine-1",
      authorId: "user-other",
      author: "Other Student",
      avatar: "/images/avatar/other.png",
      content: "Other comment",
      date: "2026-06-09",
      status: "active"
    }
  ]
}

function createContext(overrides) {
  return Object.assign({
    posts: createPosts(),
    comments: createComments(),
    users: createUsers(),
    currentUser: createUsers()[0],
    targetUser: createUsers()[1],
    myPostIds: ["manual-mine"],
    categories: [
      {
        id: 1,
        name: CATEGORY_STUDY
      },
      {
        id: 2,
        name: CATEGORY_LIFE
      }
    ]
  }, overrides || {})
}

function assertPostCardView(card) {
  assert.ok(card)
  assert.ok(card.postId)
  assert.strictEqual(typeof card.author, "object")
  assert.strictEqual(typeof card.category, "object")
  assert.strictEqual(typeof card.stats, "object")
  assert.strictEqual(typeof card.currentUserState, "object")
  assert.strictEqual(typeof card.authorName, "string")
  assert.strictEqual(typeof card.categoryName, "string")
}

let context = createContext()
const beforePosts = JSON.stringify(context.posts)
const beforeComments = JSON.stringify(context.comments)
const beforeUsers = JSON.stringify(context.users)

const mineView = buildMineProfileView(context)

assert.strictEqual(mineView.user.userId, CURRENT_USER_ID)
assert.strictEqual(mineView.user.nickname, "Current Student")
assert.strictEqual(mineView.user.avatar, "/images/avatar/current.png")
assert.strictEqual(mineView.user.department, "Computer School")

assert.deepStrictEqual(mineView.lists.myPosts.map(item => item.postId), ["mine-1", "manual-mine"])
assert.deepStrictEqual(mineView.lists.likedPosts.map(item => item.postId), ["liked-1"])
assert.deepStrictEqual(mineView.lists.collectedPosts.map(item => item.postId), ["collected-1"])
mineView.lists.myPosts.forEach(assertPostCardView)
mineView.lists.likedPosts.forEach(assertPostCardView)
mineView.lists.collectedPosts.forEach(assertPostCardView)

assert.deepStrictEqual(mineView.lists.myComments.map(item => item.commentId), [
  "comment-current-1",
  "comment-current-missing",
  "comment-current-legacy-id",
  "comment-current-display-name",
  "comment-current-nickname"
])
assert.strictEqual(mineView.lists.myComments[0].postTitle, "My first post")
assert.strictEqual(mineView.lists.myComments[0].postAvailable, true)
assert.strictEqual(mineView.lists.myComments[1].postTitle, "原帖已不可用")
assert.strictEqual(mineView.lists.myComments[1].postAvailable, false)
assert.strictEqual(mineView.lists.myComments[0].authorMatchReason, "authorId")
assert.strictEqual(mineView.lists.myComments[1].authorMatchReason, "authorId")
assert.strictEqual(mineView.lists.myComments[2].authorMatchReason, "currentUserLegacyId")
assert.strictEqual(mineView.lists.myComments[3].authorMatchReason, "currentUserDisplayName")
assert.strictEqual(mineView.lists.myComments[4].authorMatchReason, "currentUserDisplayName")

assert.deepStrictEqual(mineView.stats, {
  postCount: 2,
  likedPostCount: 1,
  collectedPostCount: 1,
  commentCount: 5,
  receivedViewCount: 15,
  receivedLikeCount: 3,
  receivedCollectCount: 5
})

const userView = buildUserProfileView(TARGET_USER_ID, context)

assert.strictEqual(userView.user.userId, TARGET_USER_ID)
assert.strictEqual(userView.user.nickname, "Target Student")
assert.strictEqual(userView.user.roleName, "Club Lead")
assert.deepStrictEqual(userView.lists.authorPosts.map(item => item.postId), ["target-1"])
assert.deepStrictEqual(userView.lists.authorComments.map(item => item.commentId), [
  "comment-target-1",
  "comment-target-nickname"
])
assert.strictEqual(userView.lists.authorComments[0].postTitle, "Target post")
assert.strictEqual(userView.lists.authorComments[0].postAvailable, true)
assert.strictEqual(userView.lists.authorComments[0].authorMatchReason, "authorId")
assert.strictEqual(userView.lists.authorComments[1].authorMatchReason, "nicknameFallback")
assert.strictEqual(
  userView.lists.authorComments.some(item => item.commentId === "comment-known-other-same-name"),
  false
)
userView.lists.authorPosts.forEach(assertPostCardView)
assert.deepStrictEqual(userView.stats, {
  postCount: 1,
  commentCount: 2,
  viewCount: 7,
  likeCount: 3,
  collectCount: 2
})
assert.deepStrictEqual(userView.state, {
  isCurrentUser: false,
  isMissingUser: false,
  canViewProfile: true
})

const currentUserView = buildUserProfileView(CURRENT_USER_ID, createContext({
  targetUser: createUsers()[0]
}))

assert.strictEqual(currentUserView.state.isCurrentUser, true)
assert.strictEqual(currentUserView.state.canViewProfile, true)

const shadowAuthorView = buildUserProfileView("user-f0if", createContext({
  users: [
    {
      userId: "user-f0if",
      nickname: "南风",
      avatar: "/images/avatar/5.png"
    }
  ],
  targetUser: {
    userId: "user-f0if",
    nickname: "南风",
    avatar: "/images/avatar/5.png"
  },
  comments: [
    {
      commentId: "old-shadow-nanfeng",
      postId: "target-1",
      authorId: "comment-author-f0if",
      author: "南风",
      avatar: "/images/avatar/wrong.png",
      content: "旧缓存中的南风评论",
      date: "2026-06-22",
      status: "active"
    }
  ]
}))

assert.deepStrictEqual(shadowAuthorView.lists.authorComments.map(item => item.commentId), ["old-shadow-nanfeng"])
assert.strictEqual(shadowAuthorView.lists.authorComments[0].authorMatchReason, "nicknameFallback")

assert.strictEqual(isCommentAuthoredByUser({
  commentId: "fallback-direct",
  author: "南风"
}, {
  userId: "user-f0if",
  nickname: "南风"
}, {
  users: []
}), true)

const missingUserView = buildUserProfileView("missing-user", createContext({
  targetUser: null
}))

assert.strictEqual(missingUserView.user.userId, "missing-user")
assert.strictEqual(missingUserView.user.nickname, "校园用户")
assert.strictEqual(missingUserView.state.isMissingUser, true)
assert.strictEqual(missingUserView.state.canViewProfile, true)
assert.deepStrictEqual(missingUserView.lists.authorPosts, [])
assert.deepStrictEqual(missingUserView.lists.authorComments, [])

assert.strictEqual(JSON.stringify(context.posts), beforePosts)
assert.strictEqual(JSON.stringify(context.comments), beforeComments)
assert.strictEqual(JSON.stringify(context.users), beforeUsers)

const storageContext = createContext()
let setStorageCount = 0

global.wx = {
  getStorageSync(key) {
    const storage = {
      forum_posts: storageContext.posts,
      forum_comments: storageContext.comments,
      forum_users: storageContext.users,
      forum_current_user: {
        userId: CURRENT_USER_ID
      },
      forum_my_posts: storageContext.myPostIds
    }

    return clone(storage[key])
  },
  setStorageSync() {
    setStorageCount += 1
  }
}

const storedMineView = getMineProfileView()
const storedUserView = getUserProfileView(TARGET_USER_ID)

assert.strictEqual(storedMineView.user.userId, CURRENT_USER_ID)
assert.deepStrictEqual(storedMineView.lists.myPosts.map(item => item.postId), ["mine-1", "manual-mine"])
assert.strictEqual(storedUserView.user.userId, TARGET_USER_ID)
assert.deepStrictEqual(storedUserView.lists.authorPosts.map(item => item.postId), ["target-1"])
assert.strictEqual(setStorageCount, 0)

console.log("profile-service tests passed")
