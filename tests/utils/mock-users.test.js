const assert = require("assert")
const mockUsers = require("../../校园论坛/utils/mock-users.js")

const posts = [
  {
    postId: 1,
    author: "林同学",
    avatar: "/images/avatar/1.png",
    view: 10,
    like: 2,
    collect: 1,
    commentCount: 3,
    isMine: false
  },
  {
    postId: 2,
    author: "林同学",
    avatar: "/images/avatar/1.png",
    view: 5,
    like: 4,
    collect: 0,
    commentCount: 1,
    isMine: false
  },
  {
    postId: 3,
    author: "当前用户",
    avatar: "/images/avatar/default.png",
    view: 7,
    like: 1,
    collect: 2,
    commentCount: 0,
    isMine: true
  }
]

const result = mockUsers.fillMockUsers(posts)

assert.strictEqual(result.posts.length, 3)
assert.strictEqual(result.users.length, 2)

const linUser = result.users.find(user => user.nickname === "林同学")
assert.ok(linUser)
assert.ok(linUser.userId.startsWith("user-"))
assert.strictEqual(linUser.isCurrentUser, false)
assert.strictEqual(linUser.stats.postCount, 2)
assert.strictEqual(linUser.stats.viewCount, 15)
assert.strictEqual(linUser.stats.likeCount, 6)
assert.strictEqual(linUser.stats.collectCount, 1)
assert.strictEqual(linUser.stats.commentCount, 4)
assert.strictEqual(linUser.posts.length, 2)
assert.ok(linUser.bio)
assert.ok(linUser.role)
assert.ok(linUser.department)
assert.ok(linUser.grade)
assert.ok(Array.isArray(linUser.tags))
assert.ok(linUser.relation)

const currentUser = result.users.find(user => user.userId === mockUsers.CURRENT_USER_ID)
assert.ok(currentUser)
assert.strictEqual(currentUser.nickname, "当前用户")
assert.strictEqual(currentUser.isCurrentUser, true)
assert.strictEqual(mockUsers.canOpenAuthorProfile(currentUser), false)
assert.strictEqual(mockUsers.getAuthorProfileUrl(currentUser), "")

const enrichedPost = result.posts.find(post => post.postId === 1)
assert.strictEqual(enrichedPost.authorId, linUser.userId)
assert.strictEqual(enrichedPost.authorInfo.userId, linUser.userId)
assert.strictEqual(mockUsers.canOpenAuthorProfile(enrichedPost), true)
assert.strictEqual(
  mockUsers.getAuthorProfileUrl(enrichedPost),
  "/pages/user/user?authorId=" + linUser.userId
)

const commentCountResult = mockUsers.fillMockUsers([
  {
    postId: 4,
    author: "Count User",
    commentCount: 5,
    comments: [
      { commentId: "c1", content: "one" },
      { commentId: "c2", content: "two" }
    ]
  }
])
const countUser = commentCountResult.users.find(user => user.nickname === "Count User")

assert.ok(countUser)
assert.strictEqual(countUser.stats.commentCount, 5)

const fallbackResult = mockUsers.fillMockUsers([
  {
    postId: 5,
    author: "Fallback User",
    commentCount: "bad-count",
    comments: [
      { commentId: "c1", content: "one" },
      { commentId: "c2", content: "two" }
    ]
  }
])
const fallbackUser = fallbackResult.users.find(user => user.nickname === "Fallback User")

assert.ok(fallbackUser)
assert.strictEqual(fallbackUser.stats.commentCount, 2)

console.log("mock-users tests passed")
