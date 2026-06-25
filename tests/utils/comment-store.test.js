const assert = require("assert")
const path = require("path")

const commentStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "comment-store.js")
const forumStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")

function resetStore(storage) {
  try {
    delete require.cache[require.resolve(commentStorePath)]
  } catch (error) {}

  try {
    delete require.cache[require.resolve(forumStorePath)]
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
assert.ok(firstComment.authorId)
assert.strictEqual(firstComment.author, "阿明")
assert.strictEqual(firstComment.avatar, "/images/avatar/2.png")
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
