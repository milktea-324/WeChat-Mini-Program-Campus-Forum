const assert = require("assert")
const path = require("path")

const commentStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-store.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")

function resetStore(storage) {
  try {
    delete require.cache[require.resolve(commentStorePath)]
  } catch (error) {}

  try {
    delete require.cache[require.resolve(forumStorePath)]
  } catch (error) {}

  try {
    delete require.cache[require.resolve(userStorePath)]
  } catch (error) {}

  const data = storage || {}

  global.wx = {
    getStorageSync(key) {
      return data[key]
    },
    setStorageSync(key, value) {
      data[key] = value
    }
  }

  return {
    store: require(commentStorePath),
    storage: data
  }
}

let context = resetStore({
  forum_posts: [
    {
      postId: 1,
      author: "楼主",
      authorId: "user-post-author",
      avatar: "/images/avatar/1.png",
      date: "2026-06-01",
      commentCount: 2,
      comments: [
        {
          commentId: 101,
          author: "阿明",
          avatar: "/images/avatar/2.png",
          content: "第一条评论",
          date: "2026-06-02"
        },
        {
          commentId: 102,
          authorId: "user-comment",
          author: "小周",
          avatar: "/images/avatar/3.png",
          content: "第二条评论",
          createdAt: "2026-06-03 10:00:00",
          date: "2026-06-03",
          status: "active"
        }
      ]
    },
    {
      postId: 2,
      author: "木子",
      avatar: "/images/avatar/4.png",
      date: "2026-06-04",
      commentCount: 1,
      comments: [
        {
          commentId: 201,
          author: "当前用户",
          avatar: "/images/avatar/default.png",
          content: "另一个帖子的评论",
          date: "2026-06-05"
        }
      ]
    }
  ]
})

let comments = context.store.getComments()

assert.strictEqual(comments.length, 3)
assert.strictEqual(context.storage.forum_comments.length, 3)
assert.strictEqual(context.storage.forum_posts[0].comments.length, 2)

const firstComment = comments.find(comment => comment.commentId === 101)
assert.ok(firstComment)
assert.strictEqual(firstComment.postId, 1)
assert.strictEqual(firstComment.authorId, "user-q46n")
assert.strictEqual(firstComment.author, "阿明")
assert.strictEqual(firstComment.avatar, "/images/avatar/3.png")
assert.strictEqual(firstComment.content, "第一条评论")
assert.strictEqual(firstComment.createdAt, "2026-06-02")
assert.strictEqual(firstComment.date, "2026-06-02")
assert.strictEqual(firstComment.parentCommentId, null)
assert.strictEqual(firstComment.rootCommentId, null)
assert.strictEqual(firstComment.level, 1)
assert.strictEqual(firstComment.likeCount, 0)
assert.strictEqual(firstComment.dislikeCount, 0)
assert.strictEqual(firstComment.isLiked, false)
assert.strictEqual(firstComment.isDisliked, false)
assert.strictEqual(firstComment.status, "active")

const currentUserComment = comments.find(comment => comment.commentId === 201)
assert.strictEqual(currentUserComment.authorId, "current-user")

assert.ok(Array.isArray(context.storage.forum_users))
assert.ok(context.storage.forum_users.some(user => user.userId === "current-user"))
assert.ok(context.storage.forum_users.some(user => user.userId === "user-comment"))
assert.ok(context.storage.forum_users.some(user => user.userId === "user-post-author"))

const secondCall = context.store.getComments()
assert.strictEqual(secondCall.length, 3)
assert.strictEqual(context.storage.forum_comments.length, 3)

const postOneComments = context.store.getCommentsByPostId("1")
assert.strictEqual(postOneComments.length, 2)
assert.ok(postOneComments.every(comment => Number(comment.postId) === 1))
assert.strictEqual(context.store.getCommentCountByPostId(1), 2)

const normalized = context.store.normalizeComment({
  content: "旧评论缺字段"
}, {
  postId: 9,
  author: "发帖人",
  authorId: "post-author-id",
  avatar: "/images/avatar/9.png",
  date: "2026-06-09"
})

assert.ok(normalized.commentId)
assert.strictEqual(normalized.postId, 9)
assert.strictEqual(normalized.authorId, "post-author-id")
assert.strictEqual(normalized.author, "发帖人")
assert.strictEqual(normalized.avatar, "/images/avatar/9.png")
assert.strictEqual(normalized.createdAt, "2026-06-09")
assert.strictEqual(normalized.date, "2026-06-09")
assert.strictEqual(normalized.status, "active")

const otherAuthorOnPost = context.store.normalizeComment({
  author: "\u8def\u4eba\u7532",
  content: "\u4e0d\u5e94\u8be5\u7ee7\u627f\u539f\u5e16\u4f5c\u8005 ID"
}, {
  postId: 9,
  author: "\u53d1\u5e16\u4eba",
  authorId: "post-author-id",
  avatar: "/images/avatar/9.png",
  date: "2026-06-09"
})

assert.notStrictEqual(otherAuthorOnPost.authorId, "post-author-id")
assert.ok(otherAuthorOnPost.authorId.startsWith("comment-author-"))
assert.strictEqual(otherAuthorOnPost.author, "\u8def\u4eba\u7532")

context = resetStore({
  forum_comments: [
    {
      commentId: "existing",
      postId: 88,
      author: "已有评论",
      content: "不应从帖子重复迁移"
    }
  ],
  forum_posts: [
    {
      postId: 88,
      commentCount: 1,
      comments: [
        {
          commentId: "from-post",
          author: "帖子评论",
          content: "不应出现"
        }
      ]
    }
  ]
})

comments = context.store.getComments()
assert.strictEqual(comments.length, 1)
assert.strictEqual(comments[0].commentId, "existing")
assert.strictEqual(context.store.getCommentsByPostId(88).length, 1)
assert.ok(context.storage.forum_users.some(user => user.nickname === "\u5df2\u6709\u8bc4\u8bba"))

context = resetStore({
  forum_comments: "bad-cache",
  forum_posts: [
    {
      postId: 3,
      comments: []
    }
  ]
})

assert.deepStrictEqual(context.store.getComments(), [])
assert.deepStrictEqual(context.storage.forum_comments, [])
assert.deepStrictEqual(context.store.getCommentsByPostId(3), [])
assert.strictEqual(context.store.getCommentCountByPostId(3), 0)
assert.ok(context.storage.forum_users.some(user => user.userId === "current-user"))

context = resetStore({
  forum_comments: [
    {
      commentId: "legacy-a",
      postId: 6,
      author: "\u65e7\u8bc4\u8bba\u4f5c\u8005",
      content: "\u7f3a\u5c11 authorId \u548c\u5934\u50cf"
    },
    {
      commentId: "legacy-b",
      postId: 6,
      author: "\u65e7\u8bc4\u8bba\u4f5c\u8005",
      avatar: "/images/avatar/8.png",
      content: "\u540c\u4e00\u4f5c\u8005\u7a33\u5b9a ID"
    }
  ],
  forum_posts: []
})

comments = context.store.getComments()
const legacyUsers = context.storage.forum_users.filter(user => user.nickname === "\u65e7\u8bc4\u8bba\u4f5c\u8005")
assert.strictEqual(legacyUsers.length, 1)
assert.ok(legacyUsers[0].userId.startsWith("comment-author-"))
assert.strictEqual(legacyUsers[0].avatar, "/images/avatar/8.png")
assert.strictEqual(comments[0].authorId, comments[1].authorId)

context = resetStore({
  forum_comments: [
    {
      commentId: "no-avatar",
      postId: 6,
      author: "\u7f3a\u5934\u50cf\u8bc4\u8bba\u4f5c\u8005",
      content: "\u7f3a\u5934\u50cf"
    }
  ],
  forum_posts: []
})

comments = context.store.getComments()
const noAvatarUser = context.storage.forum_users.find(user => user.userId === comments[0].authorId)
assert.strictEqual(noAvatarUser.avatar, "/images/avatar/default.png")

context = resetStore({
  forum_comments: [
    {
      commentId: "seed-shadow-user",
      postId: 1,
      authorId: "comment-author-f0if",
      author: "\u5357\u98ce",
      avatar: "/images/avatar/wrong.png",
      content: "\u65e7\u7f13\u5b58\u4e2d\u7684\u79cd\u5b50\u4f5c\u8005\u8bc4\u8bba"
    }
  ],
  forum_posts: [
    {
      postId: 1,
      author: "\u5c0f\u6797",
      authorId: "user-g86g",
      avatar: "/images/avatar/1.png",
      comments: []
    }
  ]
})

comments = context.store.getComments()
const seedComment = comments[0]
assert.strictEqual(seedComment.authorId, "user-f0if")
assert.strictEqual(seedComment.author, "\u5357\u98ce")
assert.strictEqual(seedComment.avatar, "/images/avatar/5.png")
assert.ok(context.storage.forum_users.some(user => (
  user.userId === "user-f0if" &&
  user.nickname === "\u5357\u98ce" &&
  user.avatar === "/images/avatar/5.png"
)))
assert.ok(!context.storage.forum_users.some(user => user.userId === "comment-author-f0if"))

context = resetStore({
  forum_comments: [
    {
      commentId: "existing-1",
      postId: 7,
      author: "已有评论",
      content: "已经在缓存中",
      status: "active"
    }
  ],
  forum_posts: []
})

const createdComment = context.store.createComment(7, "新评论", {
  authorId: "current-user",
  author: "当前用户",
  avatar: "/images/avatar/default.png",
  createdAt: "2026-06-25 10:30:00",
  date: "2026-06-25"
})

assert.ok(createdComment.commentId)
assert.strictEqual(createdComment.postId, 7)
assert.strictEqual(createdComment.authorId, "current-user")
assert.strictEqual(createdComment.author, "当前用户")
assert.strictEqual(createdComment.avatar, "/images/avatar/default.png")
assert.strictEqual(createdComment.content, "新评论")
assert.strictEqual(createdComment.createdAt, "2026-06-25 10:30:00")
assert.strictEqual(createdComment.date, "2026-06-25")
assert.strictEqual(createdComment.parentCommentId, null)
assert.strictEqual(createdComment.rootCommentId, null)
assert.strictEqual(createdComment.level, 1)
assert.strictEqual(createdComment.likeCount, 0)
assert.strictEqual(createdComment.dislikeCount, 0)
assert.strictEqual(createdComment.isLiked, false)
assert.strictEqual(createdComment.isDisliked, false)
assert.strictEqual(createdComment.status, "active")

const addedComment = context.store.addComment(createdComment)
assert.strictEqual(addedComment.commentId, createdComment.commentId)
assert.strictEqual(context.storage.forum_comments.length, 2)
assert.strictEqual(context.store.getCommentsByPostId(7).length, 2)
assert.strictEqual(context.store.getCommentCountByPostId(7), 2)
assert.ok(context.storage.forum_users.some(user => user.userId === "current-user"))

const addedOtherComment = context.store.addComment({
  commentId: "new-user-comment",
  postId: 7,
  authorId: "new-comment-user",
  author: "\u65b0\u589e\u8bc4\u8bba\u540c\u5b66",
  avatar: "/images/avatar/6.png",
  content: "\u65b0\u7528\u6237\u8bc4\u8bba"
})
assert.strictEqual(addedOtherComment.authorId, "new-comment-user")
assert.ok(context.storage.forum_users.some(user => (
  user.userId === "new-comment-user" &&
  user.nickname === "\u65b0\u589e\u8bc4\u8bba\u540c\u5b66"
)))

context = resetStore()
assert.ok(Array.isArray(context.store.getComments()))

const migrated = context.store.migrateCommentsFromPosts([
  {
    postId: "dup",
    comments: [
      { commentId: "same", author: "A", content: "one" },
      { commentId: "same", author: "A", content: "one" }
    ]
  }
])

assert.strictEqual(migrated.length, 1)

console.log("comment-store tests passed")
