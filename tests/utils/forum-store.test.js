const assert = require("assert")
const path = require("path")

const storePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-store.js")
const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")

function resetStore(storage) {
  delete require.cache[require.resolve(storePath)]
  delete require.cache[require.resolve(userStorePath)]

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
    store: require(storePath),
    storage: data
  }
}

let context = resetStore()
let posts = context.store.getPosts()

assert.ok(Array.isArray(posts))
assert.ok(posts.length > 0)
assert.strictEqual(context.storage.forum_posts, posts)
assert.ok(posts[0].comments)
assert.ok(posts[0].authorId)
assert.ok(posts[0].authorInfo)
assert.strictEqual(typeof posts[0].isLiked, "boolean")
assert.strictEqual(typeof posts[0].isCollected, "boolean")
assert.strictEqual(typeof posts[0].isMine, "boolean")
assert.strictEqual(typeof posts[0].author, "string")
assert.strictEqual(typeof posts[0].avatar, "string")
assert.ok(Array.isArray(context.storage.forum_users))
assert.ok(context.storage.forum_users.some(user => user.userId === "current-user"))
assert.ok(context.storage.forum_users.some(user => user.nickname === "小林"))
assert.deepStrictEqual(context.storage.forum_current_user, { userId: "current-user" })

const postData = context.store.getPostData()
assert.strictEqual(postData.posts, context.storage.forum_posts)
assert.ok(Array.isArray(postData.users))
assert.ok(postData.users.length > 0)

const oldView = Number(posts[0].view || 0)
const originalPostId = posts[0].postId
const updatedPost = context.store.updatePostById(String(originalPostId), post => {
  return Object.assign({}, post, {
    view: Number(post.view || 0) + 1
  })
})

assert.strictEqual(updatedPost.postId, originalPostId)
assert.strictEqual(updatedPost.view, oldView + 1)
assert.strictEqual(context.store.findPostById(originalPostId).view, oldView + 1)

const newPost = context.store.addPost({
  postId: "custom-id",
  title: "new post",
  content: "content",
  category: posts[0].category,
  author: "current user",
  isMine: true
})

assert.strictEqual(newPost.postId, "custom-id")
assert.strictEqual(context.storage.forum_posts[0].postId, "custom-id")
assert.deepStrictEqual(context.store.getMyPostIds(), [])

context.store.addMyPostId("custom-id")
context.store.addMyPostId("custom-id")

assert.deepStrictEqual(context.store.getMyPostIds(), ["custom-id"])

context = resetStore({
  forum_posts: [{
    postId: 99,
    title: "legacy",
    commentCount: 2
  }]
})
posts = context.store.getPosts()

assert.strictEqual(posts.length, 1)
assert.strictEqual(posts[0].postId, 99)
assert.strictEqual(posts[0].comments.length, 2)
assert.strictEqual(posts[0].commentCount, 2)
assert.strictEqual(posts[0].postImg, "")

context = resetStore({
  forum_posts: [{
    postId: 100,
    title: "comment count wins",
    commentCount: 5,
    comments: [
      { commentId: "c1", author: "A", content: "one" },
      { commentId: "c2", author: "B", content: "two" }
    ]
  }]
})
posts = context.store.getPosts()

assert.strictEqual(posts[0].comments.length, 2)
assert.strictEqual(posts[0].commentCount, 5)

context = resetStore({
  forum_posts: [{
    postId: 101,
    title: "comments fallback",
    commentCount: "bad-count",
    comments: [
      { commentId: "c1", author: "A", content: "one" },
      { commentId: "c2", author: "B", content: "two" }
    ]
  }]
})
posts = context.store.getPosts()

assert.strictEqual(posts[0].comments.length, 2)
assert.strictEqual(posts[0].commentCount, 2)

context = resetStore({
  forum_posts: [{
    postId: 102,
    title: "generate comments",
    commentCount: 3,
    comments: []
  }]
})
posts = context.store.getPosts()

assert.strictEqual(posts[0].comments.length, 3)
assert.strictEqual(posts[0].commentCount, 3)

console.log("forum-store tests passed")
