const assert = require("assert")
const path = require("path")

const mockCommentsPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "mock-comments.js")

delete require.cache[require.resolve(mockCommentsPath)]

const mockComments = require(mockCommentsPath)

const posts = mockComments.fillMockComments([
  {
    postId: 1,
    title: "\u6d4b\u8bd5\u5e16\u5b50",
    date: "2026-06-01",
    commentCount: 4,
    comments: []
  }
])

const comments = posts[0].comments

assert.strictEqual(comments.length, 4)

const seedAuthorComment = comments.find(comment => comment.author === "\u5357\u98ce")
assert.ok(seedAuthorComment)
assert.strictEqual(seedAuthorComment.authorId, "user-f0if")
assert.strictEqual(seedAuthorComment.avatar, "/images/avatar/5.png")
assert.strictEqual(seedAuthorComment.content, "\u6a21\u62df\u8bc4\u8bba\u5185\u5bb9-1-3")
assert.strictEqual(seedAuthorComment.date, "2026-06-01")

const nonSeedAuthorComment = comments.find(comment => comment.author === "\u5c0f\u5468")
assert.ok(nonSeedAuthorComment)
assert.strictEqual(nonSeedAuthorComment.authorId, undefined)
assert.strictEqual(nonSeedAuthorComment.avatar, "/images/avatar/2.png")

const existingComments = mockComments.fillMockComments([
  {
    postId: 2,
    commentCount: 1,
    comments: [
      {
        commentId: "kept-comment",
        author: "\u5357\u98ce",
        avatar: "/legacy.png",
        content: "\u5df2\u6709\u8bc4\u8bba"
      }
    ]
  }
])

assert.strictEqual(existingComments[0].comments[0].authorId, undefined)
assert.strictEqual(existingComments[0].comments[0].avatar, "/legacy.png")

console.log("mock-comments tests passed")
