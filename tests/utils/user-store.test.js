const assert = require("assert")
const path = require("path")

const userStorePath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "user-store.js")
const forumData = require("../../\u6821\u56ed\u8bba\u575b/data/forum-data.js")

function resetStore(storage) {
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
    },
    removeStorageSync(key) {
      delete data[key]
    }
  }

  return {
    store: require(userStorePath),
    storage: data
  }
}

let context = resetStore()
let store = context.store

assert.deepStrictEqual(store.getUsers(), [])

let currentUser = store.ensureCurrentUser()

assert.strictEqual(currentUser.userId, "current-user")
assert.strictEqual(currentUser.nickname, "当前用户")
assert.strictEqual(currentUser.avatar, "/images/avatar/default.png")
assert.strictEqual(currentUser.status, "active")
assert.ok(Array.isArray(currentUser.tags))
assert.ok(currentUser.createdAt)
assert.ok(currentUser.updatedAt)
assert.deepStrictEqual(context.storage.forum_current_user, { userId: "current-user" })
assert.strictEqual(context.storage.forum_users.length, 1)

currentUser = store.getCurrentUser()

assert.strictEqual(currentUser.userId, "current-user")
assert.strictEqual(currentUser.nickname, "当前用户")
assert.strictEqual(currentUser.avatar, "/images/avatar/default.png")

store.saveUsers([
  {
    userId: "user-lin",
    nickname: "林同学",
    avatar: "/images/avatar/1.png",
    tags: "学习交流"
  }
])

assert.deepStrictEqual(store.setCurrentUserRef("user-lin"), { userId: "user-lin" })
assert.strictEqual(store.getCurrentUserRef().userId, "user-lin")
assert.strictEqual(store.getCurrentUser().userId, "user-lin")
assert.strictEqual(store.findUserById("user-lin").nickname, "林同学")

const deduped = store.saveUsers([
  {
    userId: "dup-user",
    nickname: "旧昵称",
    avatar: "/old.png"
  },
  {
    userId: "dup-user",
    nickname: "新昵称",
    avatar: "/new.png"
  },
  {
    nickname: "无效用户"
  }
])

assert.strictEqual(deduped.length, 1)
assert.strictEqual(deduped[0].userId, "dup-user")
assert.strictEqual(deduped[0].nickname, "新昵称")
assert.strictEqual(deduped[0].avatar, "/new.png")

const normalized = store.normalizeUser({
  userId: "partial-user",
  nickname: "",
  avatar: "",
  tags: "单个标签"
})

assert.strictEqual(normalized.userId, "partial-user")
assert.strictEqual(normalized.nickname, "校园用户")
assert.strictEqual(normalized.avatar, "/images/avatar/default.png")
assert.strictEqual(normalized.status, "active")
assert.deepStrictEqual(normalized.tags, ["单个标签"])
assert.ok(normalized.createdAt)
assert.ok(normalized.updatedAt)
assert.strictEqual(store.normalizeUser({ nickname: "缺少 ID" }), null)

const currentUserFromPost = store.createUserFromPost({
  postId: 1,
  author: "任意昵称",
  avatar: "/images/avatar/2.png",
  isMine: true
})

assert.strictEqual(currentUserFromPost.userId, "current-user")
assert.strictEqual(currentUserFromPost.nickname, "当前用户")

const normalAuthorA = store.createUserFromPost({
  postId: 2,
  author: "林同学",
  avatar: "/images/avatar/3.png"
})
const normalAuthorB = store.createUserFromPost({
  postId: 3,
  author: "林同学",
  avatar: "/images/avatar/4.png"
})

assert.ok(normalAuthorA.userId.startsWith("user-"))
assert.strictEqual(normalAuthorA.userId, normalAuthorB.userId)
assert.strictEqual(normalAuthorA.nickname, "林同学")
assert.strictEqual(normalAuthorA.avatar, "/images/avatar/3.png")

const explicitAuthor = store.createUserFromPost({
  postId: 4,
  authorId: "custom-author",
  author: "已有 ID 作者"
})

assert.strictEqual(explicitAuthor.userId, "custom-author")
assert.strictEqual(explicitAuthor.nickname, "已有 ID 作者")
assert.strictEqual(explicitAuthor.avatar, "/images/avatar/default.png")

context = resetStore({
  forum_users: [
    {
      userId: "kept-user",
      nickname: "保留用户",
      avatar: "/images/avatar/9.png"
    }
  ]
})
store = context.store

const usersFromPosts = store.ensureUsersFromPosts(forumData.postList.slice(0, 3))

assert.ok(usersFromPosts.length >= 4)
assert.ok(usersFromPosts.some(user => user.userId === "kept-user"))
assert.ok(usersFromPosts.some(user => user.userId === "current-user"))
assert.ok(usersFromPosts.some(user => user.nickname === "小林"))
assert.deepStrictEqual(context.storage.forum_current_user, { userId: "current-user" })

const oldPostUserA = store.createUserFromPost({
  postId: 5,
  author: "旧帖子作者"
})
const oldPostUserB = store.createUserFromPost({
  postId: 6,
  author: "旧帖子作者"
})

assert.strictEqual(oldPostUserA.userId, oldPostUserB.userId)
assert.ok(oldPostUserA.userId.startsWith("user-"))

const noAvatarUser = store.createUserFromPost({
  postId: 7,
  author: "没有头像"
})

assert.strictEqual(noAvatarUser.avatar, "/images/avatar/default.png")

const currentUserFromComment = store.createUserFromComment({
  author: "\u5f53\u524d\u7528\u6237",
  avatar: "/images/avatar/2.png"
})

assert.strictEqual(currentUserFromComment.userId, "current-user")
assert.strictEqual(currentUserFromComment.nickname, "\u5f53\u524d\u7528\u6237")

const commentAuthorA = store.createUserFromComment({
  author: "\u8bc4\u8bba\u540c\u5b66",
  avatar: "/images/avatar/7.png"
})
const commentAuthorB = store.createUserFromComment({
  author: "\u8bc4\u8bba\u540c\u5b66"
})

assert.ok(commentAuthorA.userId.startsWith("comment-author-"))
assert.strictEqual(commentAuthorA.userId, commentAuthorB.userId)
assert.strictEqual(commentAuthorA.nickname, "\u8bc4\u8bba\u540c\u5b66")
assert.strictEqual(commentAuthorA.avatar, "/images/avatar/7.png")

const seedCommentAuthor = store.createUserFromComment({
  authorId: "comment-author-f0if",
  author: "\u5357\u98ce",
  avatar: "/images/avatar/wrong.png"
})

assert.strictEqual(seedCommentAuthor.userId, "user-f0if")
assert.strictEqual(seedCommentAuthor.nickname, "\u5357\u98ce")
assert.strictEqual(seedCommentAuthor.avatar, "/images/avatar/5.png")

const explicitCommentAuthor = store.createUserFromComment({
  authorId: "comment-explicit-user",
  author: "\u5df2\u6709 ID \u8bc4\u8bba\u8005"
})

assert.strictEqual(explicitCommentAuthor.userId, "comment-explicit-user")
assert.strictEqual(explicitCommentAuthor.nickname, "\u5df2\u6709 ID \u8bc4\u8bba\u8005")
assert.strictEqual(explicitCommentAuthor.avatar, "/images/avatar/default.png")

const fallbackCommentAuthor = store.createUserFromComment({
  content: "\u7f3a\u5c11\u4f5c\u8005\u7684\u8bc4\u8bba"
})

assert.ok(fallbackCommentAuthor.userId.startsWith("comment-author-"))
assert.strictEqual(fallbackCommentAuthor.nickname, "\u6821\u56ed\u7528\u6237")
assert.strictEqual(fallbackCommentAuthor.avatar, "/images/avatar/default.png")

context = resetStore({
  forum_users: [
    {
      userId: "kept-comment-user",
      nickname: "\u4fdd\u7559\u8bc4\u8bba\u7528\u6237",
      avatar: "/images/avatar/10.png"
    }
  ]
})
store = context.store

const usersFromComments = store.ensureUsersFromComments([
  {
    authorId: "comment-user-a",
    author: "\u8bc4\u8bba\u4f5c\u8005 A",
    avatar: "/images/avatar/11.png"
  },
  {
    author: "\u8bc4\u8bba\u4f5c\u8005 B"
  }
])

assert.ok(usersFromComments.some(user => user.userId === "kept-comment-user"))
assert.ok(usersFromComments.some(user => user.userId === "current-user"))
assert.ok(usersFromComments.some(user => user.userId === "comment-user-a"))
assert.ok(usersFromComments.some(user => user.nickname === "\u8bc4\u8bba\u4f5c\u8005 B"))
assert.deepStrictEqual(context.storage.forum_current_user, { userId: "current-user" })

context = resetStore()
store = context.store

const usersFromSeedComments = store.ensureUsersFromComments([
  {
    authorId: "comment-author-f0if",
    author: "\u5357\u98ce",
    avatar: "/images/avatar/wrong.png"
  }
])

assert.ok(usersFromSeedComments.some(user => (
  user.userId === "user-f0if" &&
  user.nickname === "\u5357\u98ce" &&
  user.avatar === "/images/avatar/5.png"
)))
assert.ok(!usersFromSeedComments.some(user => user.userId === "comment-author-f0if"))

store.resetUsersForTest()
assert.strictEqual(context.storage.forum_users, undefined)
assert.strictEqual(context.storage.forum_current_user, undefined)

console.log("user-store tests passed")
