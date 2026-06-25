const assert = require("assert")
const path = require("path")

const navPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "route-nav.js")

function resetEnv(pages) {
  delete require.cache[require.resolve(navPath)]

  const calls = []

  global.getCurrentPages = function() {
    return pages || []
  }

  global.wx = {
    navigateTo(options) {
      calls.push({ type: "navigateTo", options })
    },
    redirectTo(options) {
      calls.push({ type: "redirectTo", options })
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

assert.strictEqual(context.nav.goPostDetail(""), false)
assert.deepStrictEqual(context.calls, [])

context = resetEnv([{
  route: "pages/detail/detail",
  options: { postId: "10" }
}])

assert.strictEqual(context.nav.goPostDetail(10), false)
assert.deepStrictEqual(context.calls, [])

context = resetEnv([
  {
    route: "pages/index/index",
    options: {}
  },
  {
    route: "pages/detail/detail",
    options: { postId: "10" }
  },
  {
    route: "pages/user/user",
    options: { authorId: "user-lin" }
  }
])

assert.strictEqual(context.nav.goPostDetail("10"), true)
assert.deepStrictEqual(context.calls, [{
  type: "navigateBack",
  options: { delta: 1 }
}])

context = resetEnv([{
  route: "pages/index/index",
  options: {}
}])

assert.strictEqual(context.nav.goPostDetail(12), true)
assert.deepStrictEqual(context.calls, [{
  type: "navigateTo",
  options: { url: "/pages/detail/detail?postId=12" }
}])

context = resetEnv([
  { route: "pages/index/index", options: {} },
  { route: "pages/detail/detail", options: { postId: "1" } },
  { route: "pages/user/user", options: { authorId: "user-1" } },
  { route: "pages/detail/detail", options: { postId: "2" } },
  { route: "pages/user/user", options: { authorId: "user-2" } },
  { route: "pages/detail/detail", options: { postId: "3" } },
  { route: "pages/user/user", options: { authorId: "user-3" } },
  { route: "pages/detail/detail", options: { postId: "4" } }
])

assert.strictEqual(context.nav.goPostDetail(99), true)
assert.deepStrictEqual(context.calls, [{
  type: "redirectTo",
  options: { url: "/pages/detail/detail?postId=99" }
}])

context = resetEnv([
  {
    route: "pages/detail/detail",
    options: { postId: "10" }
  },
  {
    route: "pages/user/user",
    options: { authorId: "user-lin" }
  }
])

assert.strictEqual(context.nav.goPostDetail(11), true)
assert.deepStrictEqual(context.calls, [{
  type: "navigateTo",
  options: { url: "/pages/detail/detail?postId=11" }
}])

console.log("route-nav tests passed")
