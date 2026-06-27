const assert = require("assert")
const path = require("path")

const servicePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-service.js")
const {
  buildCommentItemView,
  buildCommentThreadView,
  getPostCommentViews,
  getUserCommentViews
} = require(servicePath)

const CURRENT_USER_ID = "current-user"
const REAL_CURRENT_USER_ID = "student-current"
const TARGET_USER_ID = "user-target"

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createUsers() {
  return [
    {
      userId: CURRENT_USER_ID,
      nickname: "\u5f53\u524d\u7528\u6237",
      avatar: "/images/avatar/current.png",
      roleName: "\u5b66\u751f"
    },
    {
      userId: TARGET_USER_ID,
      nickname: "\u76ee\u6807\u540c\u5b66",
      avatar: "/images/avatar/target.png",
      roleName: "\u793e\u957f"
    },
    {
      userId: "user-other",
      nickname: "\u5176\u4ed6\u540c\u5b66",
      avatar: "/images/avatar/other.png",
      roleName: "\u5b66\u751f"
    }
  ]
}

function createPosts() {
  return [
    {
      postId: "post-1",
      title: "\u53ef\u67e5\u770b\u5e16\u5b50",
      authorId: TARGET_USER_ID,
      author: "\u76ee\u6807\u540c\u5b66"
    },
    {
      postId: "post-2",
      title: "\u53e6\u4e00\u6761\u5e16\u5b50",
      authorId: "user-other",
      author: "\u5176\u4ed6\u540c\u5b66"
    }
  ]
}

function createComments() {
  return [
    {
      commentId: "root-old-null",
      postId: "post-1",
      authorId: TARGET_USER_ID,
      author: "\u76ee\u6807\u540c\u5b66",
      avatar: "/images/avatar/target-old.png",
      content: "\u65e7\u4e00\u7ea7\u8bc4\u8bba",
      createdAt: "2026-06-20 10:00:00",
      date: "2026-06-20",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      likeCount: 3,
      dislikeCount: 1,
      isLiked: true,
      isDisliked: false,
      status: "active"
    },
    {
      commentId: "reply-by-root",
      postId: "post-1",
      authorId: "user-other",
      author: "\u5176\u4ed6\u540c\u5b66",
      avatar: "/images/avatar/other.png",
      content: "\u6309 root \u5f52\u7ec4\u7684\u56de\u590d",
      createdAt: "2026-06-20 10:05:00",
      date: "2026-06-20",
      parentCommentId: "root-old-null",
      rootCommentId: "root-old-null",
      level: 2,
      likeCount: 1,
      dislikeCount: 0,
      isLiked: false,
      isDisliked: true,
      status: "active"
    },
    {
      commentId: "reply-by-parent",
      postId: "post-1",
      authorId: CURRENT_USER_ID,
      author: "\u5f53\u524d\u7528\u6237",
      avatar: "/images/avatar/current.png",
      content: "\u6309 parent \u5f52\u7ec4\u7684\u56de\u590d",
      createdAt: "2026-06-20 10:06:00",
      date: "2026-06-20",
      parentCommentId: "root-old-null",
      rootCommentId: null,
      level: 2,
      likeCount: 0,
      dislikeCount: 0,
      isLiked: false,
      isDisliked: false,
      status: "active"
    },
    {
      commentId: "deleted-comment",
      postId: "post-1",
      authorId: TARGET_USER_ID,
      author: "\u76ee\u6807\u540c\u5b66",
      content: "\u5df2\u5220\u9664",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      status: "deleted"
    },
    {
      commentId: "target-nickname",
      postId: "missing-post",
      authorId: "legacy-target-id",
      author: "\u76ee\u6807\u540c\u5b66",
      avatar: "/images/avatar/legacy.png",
      content: "\u6635\u79f0\u515c\u5e95\u5f52\u5c5e",
      createdAt: "2026-06-21 11:00:00",
      date: "2026-06-21",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      status: "active"
    },
    {
      commentId: "current-display",
      postId: "post-2",
      author: "\u5f53\u524d\u7528\u6237",
      avatar: "/images/avatar/current-legacy.png",
      content: "\u5f53\u524d\u7528\u6237\u663e\u793a\u540d\u517c\u5bb9",
      createdAt: "2026-06-22 12:00:00",
      date: "2026-06-22",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      status: "active"
    }
  ]
}

function createContext(overrides) {
  return Object.assign({
    comments: createComments(),
    posts: createPosts(),
    users: createUsers(),
    currentUser: createUsers()[0],
    targetUser: createUsers()[1],
    fallbackNickname: "\u76ee\u6807\u540c\u5b66"
  }, overrides || {})
}

const context = createContext()
const beforeComments = JSON.stringify(context.comments)
const beforePosts = JSON.stringify(context.posts)
const beforeUsers = JSON.stringify(context.users)

let view = buildCommentItemView(context.comments[0], context)

assert.strictEqual(view.commentId, "root-old-null")
assert.strictEqual(view.postId, "post-1")
assert.strictEqual(view.parentCommentId, null)
assert.strictEqual(view.rootCommentId, null)
assert.strictEqual(view.level, 1)
assert.strictEqual(view.content, "\u65e7\u4e00\u7ea7\u8bc4\u8bba")
assert.strictEqual(view.status, "active")
assert.deepStrictEqual(view.author, {
  userId: TARGET_USER_ID,
  nickname: "\u76ee\u6807\u540c\u5b66",
  avatar: "/images/avatar/target.png",
  roleName: "\u793e\u957f"
})
assert.deepStrictEqual(view.replyToUser, null)
assert.deepStrictEqual(view.stats, {
  likeCount: 3,
  dislikeCount: 1,
  replyCount: 2
})
assert.deepStrictEqual(view.currentUserState, {
  reaction: "like",
  isLiked: true,
  isDisliked: false,
  isMine: false,
  canDelete: false
})
assert.deepStrictEqual(view.post, {
  postId: "post-1",
  title: "\u53ef\u67e5\u770b\u5e16\u5b50",
  available: true
})
assert.strictEqual(view.createdAt, "2026-06-20 10:00:00")
assert.strictEqual(view.displayTime, "2026-06-20")
assert.strictEqual(view.authorMatchReason, "authorId")
assert.strictEqual(view.authorId, TARGET_USER_ID)
assert.strictEqual(view.authorName, "\u76ee\u6807\u540c\u5b66")
assert.strictEqual(view.avatar, "/images/avatar/target.png")
assert.strictEqual(view.date, "2026-06-20")
assert.strictEqual(view.postTitle, "\u53ef\u67e5\u770b\u5e16\u5b50")
assert.strictEqual(view.postAvailable, true)

view = buildCommentItemView({
  commentId: "missing-user",
  postId: "missing-post",
  authorId: "ghost-user",
  author: "\u65e7\u8bc4\u8bba\u4f5c\u8005",
  avatar: "/images/avatar/ghost.png",
  content: "\u7528\u539f\u8bc4\u8bba\u515c\u5e95",
  date: "2026-06-23"
}, createContext({ users: [] }))

assert.strictEqual(view.author.userId, "ghost-user")
assert.strictEqual(view.author.nickname, "\u65e7\u8bc4\u8bba\u4f5c\u8005")
assert.strictEqual(view.author.avatar, "/images/avatar/ghost.png")
assert.strictEqual(view.author.roleName, "\u7528\u6237")
assert.strictEqual(view.postAvailable, false)
assert.strictEqual(view.postTitle, "\u539f\u5e16\u5df2\u4e0d\u53ef\u7528")

view = buildCommentItemView(context.comments[2], context)
assert.strictEqual(view.currentUserState.isMine, true)
assert.strictEqual(view.currentUserState.canDelete, true)
assert.strictEqual(view.authorMatchReason, "currentUserLegacyId")
assert.deepStrictEqual(view.replyToUser, {
  userId: TARGET_USER_ID,
  nickname: "\u76ee\u6807\u540c\u5b66"
})

view = buildCommentItemView(context.comments[5], context)
assert.strictEqual(view.currentUserState.isMine, true)
assert.strictEqual(view.authorMatchReason, "currentUserDisplayName")

view = buildCommentItemView(context.comments[4], context)
assert.strictEqual(view.authorMatchReason, "nicknameFallback")
assert.strictEqual(view.author.userId, TARGET_USER_ID)
assert.strictEqual(view.authorId, "legacy-target-id")
assert.strictEqual(view.rawAuthorId, "legacy-target-id")
assert.strictEqual(view.legacyAuthorId, "legacy-target-id")
assert.strictEqual(view.authorName, "\u76ee\u6807\u540c\u5b66")
assert.strictEqual(view.rawAuthorName, "\u76ee\u6807\u540c\u5b66")
assert.strictEqual(view.postAvailable, false)

let threads = getPostCommentViews("post-1", context)

assert.strictEqual(threads.length, 1)
assert.strictEqual(threads[0].rootComment.commentId, "root-old-null")
assert.deepStrictEqual(threads[0].replies.map(item => item.commentId), ["reply-by-root", "reply-by-parent"])
assert.strictEqual(threads[0].replyCount, 2)
assert.strictEqual(threads[0].rootComment.stats.replyCount, 2)
assert.ok(!threads[0].replies.some(item => item.commentId === "deleted-comment"))
assert.strictEqual(threads[0].replies[0].replyToUser.nickname, "\u76ee\u6807\u540c\u5b66")

const thread = buildCommentThreadView(context.comments[0], [context.comments[1], context.comments[2]], context)
assert.strictEqual(thread.rootComment.commentId, "root-old-null")
assert.strictEqual(thread.replyCount, 2)
assert.deepStrictEqual(thread.replies.map(item => item.commentId), ["reply-by-root", "reply-by-parent"])

let userComments = getUserCommentViews(TARGET_USER_ID, context)
assert.deepStrictEqual(userComments.map(item => item.commentId), ["target-nickname", "root-old-null"])
assert.strictEqual(userComments[0].authorMatchReason, "nicknameFallback")
assert.strictEqual(userComments[1].authorMatchReason, "authorId")

userComments = getUserCommentViews(CURRENT_USER_ID, createContext({
  targetUser: createUsers()[0],
  currentUser: createUsers()[0],
  fallbackNickname: "\u5f53\u524d\u7528\u6237"
}))
assert.deepStrictEqual(userComments.map(item => item.commentId), [
  "current-display",
  "reply-by-parent"
])
assert.strictEqual(userComments[0].authorMatchReason, "currentUserDisplayName")
assert.strictEqual(userComments[1].authorMatchReason, "authorId")

userComments = getUserCommentViews(REAL_CURRENT_USER_ID, createContext({
  users: [
    {
      userId: REAL_CURRENT_USER_ID,
      nickname: "\u6d4b\u8bd5\u540c\u5b66",
      avatar: "/images/avatar/12.png",
      roleName: "\u5b66\u751f"
    }
  ],
  currentUser: {
    userId: REAL_CURRENT_USER_ID,
    nickname: "\u6d4b\u8bd5\u540c\u5b66",
    avatar: "/images/avatar/12.png",
    roleName: "\u5b66\u751f"
  },
  targetUser: {
    userId: REAL_CURRENT_USER_ID,
    nickname: "\u6d4b\u8bd5\u540c\u5b66",
    avatar: "/images/avatar/12.png",
    roleName: "\u5b66\u751f"
  },
  fallbackNickname: "\u6d4b\u8bd5\u540c\u5b66",
  comments: [
    {
      commentId: "real-current-legacy-id",
      postId: "post-1",
      authorId: CURRENT_USER_ID,
      author: "\u5f53\u524d\u7528\u6237",
      content: "\u65e7 current-user id",
      date: "2026-06-23",
      status: "active"
    },
    {
      commentId: "real-current-display",
      postId: "post-1",
      author: "\u5f53\u524d\u7528\u6237",
      content: "\u65e7\u5f53\u524d\u7528\u6237\u540d",
      date: "2026-06-24",
      status: "active"
    },
    {
      commentId: "real-current-nickname",
      postId: "post-1",
      authorId: "legacy-current-id",
      author: "\u6d4b\u8bd5\u540c\u5b66",
      content: "\u65e7\u6635\u79f0\u515c\u5e95",
      date: "2026-06-25",
      status: "active"
    },
    {
      commentId: "real-current-other",
      postId: "post-1",
      authorId: "user-other",
      author: "\u5176\u4ed6\u540c\u5b66",
      content: "\u4e0d\u5c5e\u4e8e\u5f53\u524d\u7528\u6237",
      date: "2026-06-26",
      status: "active"
    }
  ]
}))
assert.deepStrictEqual(userComments.map(item => item.commentId), [
  "real-current-nickname",
  "real-current-display",
  "real-current-legacy-id"
])
assert.strictEqual(userComments[0].authorMatchReason, "currentUserDisplayName")
assert.strictEqual(userComments[1].authorMatchReason, "currentUserDisplayName")
assert.strictEqual(userComments[2].authorMatchReason, "currentUserLegacyId")

assert.strictEqual(JSON.stringify(context.comments), beforeComments)
assert.strictEqual(JSON.stringify(context.posts), beforePosts)
assert.strictEqual(JSON.stringify(context.users), beforeUsers)

console.log("comment-service tests passed")
