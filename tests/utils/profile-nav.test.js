const assert = require("assert")
const path = require("path")

const navPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "profile-nav.js")

function resetEnv(pages) {
  delete require.cache[require.resolve(navPath)]

  const calls = []

  global.getCurrentPages = function() {
    return pages || []
  }

  global.wx = {
    switchTab(options) {
      calls.push({ type: "switchTab", options })
    },
    navigateTo(options) {
      calls.push({ type: "navigateTo", options })
    },
    navigateBack(options) {
      calls.push({ type: "navigateBack", options })
    }
  }

  return {
    nav: require(navPath),
    calls: calls
  }
}

let context = resetEnv([])

assert.strictEqual(context.nav.goUserProfile({
  userId: "current-user",
  nickname: "当前用户",
  avatar: "/images/avatar/default.png"
}), true)
assert.deepStrictEqual(context.calls, [{
  type: "switchTab",
  options: { url: "/pages/mine/mine" }
}])

context = resetEnv([{
  route: "pages/user/user",
  options: { authorId: "user-lin" }
}])

assert.strictEqual(context.nav.goUserProfile({
  userId: "user-lin",
  nickname: "林同学"
}), false)
assert.deepStrictEqual(context.calls, [])

context = resetEnv([
  {
    route: "pages/user/user",
    options: { authorId: "user-lin" }
  },
  {
    route: "pages/detail/detail",
    options: { postId: "1" }
  }
])

assert.strictEqual(context.nav.goUserProfile({
  userId: "user-lin",
  nickname: "林同学"
}), true)
assert.deepStrictEqual(context.calls, [{
  type: "navigateBack",
  options: { delta: 1 }
}])

context = resetEnv([{
  route: "pages/index/index",
  options: {}
}])

assert.strictEqual(context.nav.goUserProfile({
  userId: "comment-author-1",
  nickname: "评论 同学",
  avatar: "/images/avatar/1.png"
}), true)
assert.strictEqual(context.calls.length, 1)
assert.strictEqual(context.calls[0].type, "navigateTo")
assert.strictEqual(
  context.calls[0].options.url,
  "/pages/user/user?authorId=comment-author-1&nickname=%E8%AF%84%E8%AE%BA%20%E5%90%8C%E5%AD%A6&avatar=%2Fimages%2Favatar%2F1.png"
)

context = resetEnv([])

assert.strictEqual(context.nav.goUserProfile({
  nickname: "无 ID 用户"
}), false)
assert.deepStrictEqual(context.calls, [])

console.log("profile-nav tests passed")
