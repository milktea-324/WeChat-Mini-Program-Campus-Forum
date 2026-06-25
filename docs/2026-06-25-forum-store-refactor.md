# 校园论坛数据访问层改造记录

## 1. 本轮改造目标

本轮改造为校园论坛微信小程序新增统一帖子数据访问层 `utils/forum-store.js`，把原先散落在首页、详情页、发布页、个人页、作者页中的帖子本地缓存读取、初始化、保存、单条更新、我的发布 ID 记录等逻辑集中管理。

新增该访问层的主要原因是：多个页面都需要读取 `forum_posts` 后补齐默认字段、补全模拟评论、补全作者信息，再写回缓存。重复代码容易造成页面之间状态不同步，也不利于后续继续拆分用户、评论、点赞、收藏等对象。改造后，页面主要负责 UI 状态、交互和跳转，帖子缓存和数据归一化由 `forum-store` 统一处理。

## 2. 新增文件

* `校园论坛/utils/forum-store.js`
  * 职责：集中管理帖子列表缓存 `forum_posts` 和我的发布 ID 缓存 `forum_my_posts`。
  * 职责：缓存为空时使用 `data/forum-data.js` 中的 `postList` 初始化帖子数据。
  * 职责：读取帖子时统一补齐默认字段、模拟评论、作者信息和作者统计信息。
  * 职责：提供帖子保存、单条查找、单条更新、新增帖子、读取和记录我的发布 ID 等方法。

* `tests/utils/forum-store.test.js`
  * 职责：为 `forum-store` 提供 Node `assert` 测试。
  * 覆盖内容：缓存初始化、默认字段补齐、评论和作者信息补全、按 ID 更新帖子、新增帖子、我的发布 ID 记录和去重、旧帖子数据兼容。

## 3. 修改文件

| 文件 | 改动内容 |
| --- | --- |
| `校园论坛/pages/index/index.js` | 将首页帖子初始化和读取逻辑改为调用 `forum-store`；保留首页列表、搜索、分类、排序和热帖轮播逻辑。 |
| `校园论坛/pages/detail/detail.js` | 将详情页浏览数增加、点赞、收藏、评论后的帖子写回逻辑改为调用 `forum-store.updatePostById()`；保留原有交互和提示逻辑。 |
| `校园论坛/pages/publish/publish.js` | 将发布新帖子写入 `forum_posts` 改为调用 `forum-store.addPost()`；将我的发布 ID 写入 `forum_my_posts` 改为调用 `forum-store.addMyPostId()`。 |
| `校园论坛/pages/mine/mine.js` | 将个人页帖子读取和我的发布 ID 读取改为调用 `forum-store`；保留我的发布、我的收藏、我的点赞列表生成和统计逻辑。 |
| `校园论坛/pages/user/user.js` | 将作者页帖子和作者集合读取改为调用 `forum-store.getPostData()`；保留作者资料展示、作者帖子展示和作者页跳转限制逻辑。 |

## 4. `utils/forum-store.js` 当前 API

```js
getPosts()
```

说明：

* 参数：无
* 返回值：帖子数组
* 作用：读取帖子缓存；缓存为空时使用 `forumData.postList` 初始化；统一补齐默认字段、模拟评论和作者信息，并写回 `forum_posts`
* 调用位置：`pages/index/index.js`、`pages/mine/mine.js`

```js
getPostData()
```

说明：

* 参数：无
* 返回值：`{ posts, users }`
* 作用：读取并归一化帖子数据，同时返回由帖子生成的作者集合；适合需要作者资料和作者统计的页面
* 调用位置：`pages/user/user.js`

```js
savePosts(posts)
```

说明：

* 参数：`posts`，帖子数组
* 返回值：保存后的帖子数组
* 作用：归一化传入帖子数组后写入 `forum_posts`
* 调用位置：当前页面未直接调用；由 `forum-store.addPost()`、`forum-store.updatePostById()` 内部调用

```js
findPostById(postId)
```

说明：

* 参数：`postId`，帖子 ID
* 返回值：找到的帖子对象；找不到时返回 `null`
* 作用：根据帖子 ID 查找单条帖子；ID 比较兼容原有数字化比较逻辑，也兼容非数字字符串 ID
* 调用位置：`pages/detail/detail.js`

```js
updatePostById(postId, updater)
```

说明：

* 参数：`postId`，帖子 ID；`updater`，更新函数或新帖子对象
* 返回值：更新并保存后的帖子对象；找不到时返回 `null`
* 作用：读取当前帖子列表，定位单条帖子，应用更新，重新归一化并保存到 `forum_posts`
* 调用位置：`pages/detail/detail.js`

```js
addPost(post)
```

说明：

* 参数：`post`，待新增的帖子对象
* 返回值：新增并保存后的帖子对象
* 作用：把新帖子插入帖子列表顶部，归一化后保存到 `forum_posts`
* 调用位置：`pages/publish/publish.js`

```js
getMyPostIds()
```

说明：

* 参数：无
* 返回值：当前用户发布过的帖子 ID 数组
* 作用：读取 `forum_my_posts`；缓存不存在或不是数组时返回空数组
* 调用位置：`pages/mine/mine.js`

```js
addMyPostId(postId)
```

说明：

* 参数：`postId`，帖子 ID
* 返回值：更新后的我的发布 ID 数组
* 作用：把当前用户发布的新帖子 ID 写入 `forum_my_posts`，并避免同一个 ID 重复记录
* 调用位置：`pages/publish/publish.js`

```js
normalizePost(post)
```

说明：

* 参数：`post`，单条帖子对象
* 返回值：补齐默认字段、评论和作者信息后的帖子对象
* 作用：兼容旧帖子数据，补齐 `view`、`like`、`collect`、`commentCount`、`isLiked`、`isCollected`、`isMine`、`comments`、`postImg` 等字段
* 调用位置：当前页面未直接调用；由 `forum-store.addPost()`、`forum-store.updatePostById()` 内部调用

## 5. 当前数据流

* 初始数据来自 `校园论坛/data/forum-data.js` 中的 `postList`。
* 帖子列表缓存 key 为 `forum_posts`。
* 当前用户发布过的帖子 ID 缓存 key 为 `forum_my_posts`。
* 首页 `pages/index/index.js` 通过 `forumStore.getPosts()` 读取帖子，之后在页面内继续执行热帖轮播、搜索、分类和排序。
* 详情页 `pages/detail/detail.js` 打开帖子时通过 `forumStore.updatePostById()` 增加浏览数；点赞、收藏、评论后也通过同一方法更新单条帖子并写回缓存。
* 发布页 `pages/publish/publish.js` 组装新帖子后通过 `forumStore.addPost()` 插入列表顶部，再通过 `forumStore.addMyPostId()` 记录我的发布 ID。
* 个人页 `pages/mine/mine.js` 通过 `forumStore.getPosts()` 读取帖子，通过 `forumStore.getMyPostIds()` 读取我的发布 ID，然后在页面内生成我的发布、我的收藏、我的点赞列表和统计数据。
* 作者页 `pages/user/user.js` 通过 `forumStore.getPostData()` 获取归一化帖子和用户集合，再用 `mockUsers.findUserById()` 找到作者资料和该作者帖子。

## 6. 当前本地缓存 key

* `forum_posts`
  * 存储内容：帖子数组。
  * 数据来源：首次为空时来自 `forumData.postList`；之后由首页读取、详情页互动、发布页新增等流程持续更新。
  * 当前写入位置：`utils/forum-store.js`。

* `forum_my_posts`
  * 存储内容：当前用户发布过的帖子 ID 数组。
  * 数据来源：发布页发布成功后记录新帖子 ID。
  * 当前写入位置：`utils/forum-store.js`。

## 7. 页面直接读写缓存的剩余情况

当前检查的目标调用：

```js
wx.getStorageSync("forum_posts")
wx.setStorageSync("forum_posts")
wx.getStorageSync("forum_my_posts")
wx.setStorageSync("forum_my_posts")
```

检查结果：

| 调用位置 | 是否还存在 | 是否合理 | 后续建议 |
| --- | --- | --- | --- |
| `校园论坛/pages/index/index.js` | 不存在 | 合理，已收敛到 `forum-store.js` | 保持页面只调用 store。 |
| `校园论坛/pages/detail/detail.js` | 不存在 | 合理，已收敛到 `forum-store.js` | 后续互动状态继续通过 store 更新。 |
| `校园论坛/pages/publish/publish.js` | 不存在 | 合理，已收敛到 `forum-store.js` | 后续发布相关缓存继续通过 store 写入。 |
| `校园论坛/pages/mine/mine.js` | 不存在 | 合理，已收敛到 `forum-store.js` | 后续个人页派生列表仍保留在页面层即可。 |
| `校园论坛/pages/user/user.js` | 不存在 | 合理，已收敛到 `forum-store.js` | 后续作者资料拆分前继续通过 `getPostData()` 获取。 |
| `校园论坛/utils/forum-store.js` | 存在 | 合理，这是统一数据访问层 | 不建议继续外移，除非后续引入更底层 storage 工具。 |

补充说明：项目中其他非论坛帖子缓存，例如 `pages/logs/logs.js` 的 `logs` 缓存，不属于本轮 `forum_posts` / `forum_my_posts` 收敛范围。

## 8. 本轮未改动的内容

* 没有拆分用户表。
* 没有拆分评论表。
* 没有拆分点赞表。
* 没有拆分收藏表。
* 没有拆分统计表。
* 没有新增标签对象。
* 没有接入后端。
* 没有接入云开发。
* 没有新增 npm 包或第三方库。
* 没有新增真实登录。
* 没有清空本地缓存。
* 没有修改 WXML。
* 没有修改 WXSS。
* 没有修改 UI 样式。
* 没有修改 tabBar。
* 没有修改路由配置。
* 没有提交 git commit。

## 9. 已测试功能

本轮已执行的自动检查：

* `node tests/utils/forum-store.test.js`
* `node tests/utils/mock-users.test.js`
* `node --check 校园论坛/utils/forum-store.js`
* `node --check 校园论坛/pages/index/index.js`
* `node --check 校园论坛/pages/detail/detail.js`
* `node --check 校园论坛/pages/publish/publish.js`
* `node --check 校园论坛/pages/mine/mine.js`
* `node --check 校园论坛/pages/user/user.js`

建议在微信开发者工具中人工确认的功能：

| 功能 | 当前状态 |
| --- | --- |
| 首页帖子列表 | 需要人工确认 |
| 首页搜索 | 需要人工确认 |
| 首页分类 | 需要人工确认 |
| 首页排序 | 需要人工确认 |
| 首页热帖轮播 | 需要人工确认 |
| 详情页浏览数 | 需要人工确认 |
| 详情页点赞 | 需要人工确认 |
| 详情页收藏 | 需要人工确认 |
| 详情页评论 | 需要人工确认 |
| 发布页发布帖子 | 需要人工确认 |
| 我的发布 | 需要人工确认 |
| 我的收藏 | 需要人工确认 |
| 我的点赞 | 需要人工确认 |
| 作者详情页 | 需要人工确认 |

说明：本轮在 Node 环境中验证了 store 行为和 JS 语法，但没有通过微信开发者工具完成真实页面交互验证。

## 10. 已知问题

当前微信开发者工具中出现的报错：

```text
Error: timeout
    at Function.<anonymous> (WAServiceMainContext.js?t=wechat&v=3.16.1:1)
    at p (WAServiceMainContext.js?t=wechat&v=3.16.1:1)
    at WAServiceMainContext.js?t=wechat&v=3.16.1:1
    at WAServiceMainContext.js?t=wechat&v=3.16.1:1
(env: Windows,mp,2.01.2510280; lib: 3.16.1)
```

当前判断：

* 该报错是否影响功能：暂未确认。需要结合微信开发者工具中的具体操作路径观察，例如是否发生在编译、页面切换、上传、预览、网络请求或工具内部服务调用时。
* 是否能定位到项目代码：暂时不能。堆栈只显示 `WAServiceMainContext.js`，没有指向本项目具体 JS 文件、页面方法或行号。
* 当前标记：非阻塞观察项。

后续建议：

* 如果功能正常且报错偶发，可先记录为工具环境或运行时层面的观察项。
* 如果每次固定操作都会出现，需要记录触发步骤、页面路径、控制台上下文和是否伴随功能失败，再进一步定位。
* 如果涉及网络、上传、预览或远程连接失败，应优先考虑当前互联网环境、VPN 或代理配置影响。本机 v2rayN mixed 端口为 `10808`。

## 11. 后续建议

基于当前改造后的代码，下一步更适合先做“评论对象分离”的设计评估，但只建议先形成设计文档，不建议直接重构。

理由：

* 当前 `forum-store` 已经把帖子读取和归一化集中起来，评论仍嵌套在帖子对象的 `comments` 字段中。
* 详情页评论新增、评论数量 `commentCount`、模拟评论补全都与帖子读取流程强相关。
* 评论对象分离后，可以更清晰地处理评论 ID、评论作者、评论数量同步、模拟评论与用户新增评论的边界。
* 但目前验收要求明确保持数据结构不变，因此本轮没有拆分评论表。

其他对象设计建议：

* 用户/作者对象分离：适合在评论对象之后做。当前作者信息由 `mock-users.js` 根据帖子生成，作者统计也由帖子派生。后续可设计独立 `users` 数据源，但需要先明确当前用户、模拟作者、作者统计的关系。
* 点赞收藏关系对象分离：适合在用户对象更稳定后做。当前 `isLiked`、`isCollected`、`like`、`collect` 仍在帖子对象上，能满足本地演示。后续若要支持多用户，应拆成用户与帖子之间的关系对象。
* 标签对象设计：当前帖子只有分类，没有独立标签系统。建议等帖子、用户、评论关系更清楚后再设计。
* 统计对象设计：当前浏览数、点赞数、收藏数、评论数都在帖子对象上，作者统计由 `mock-users.js` 派生。建议暂时继续派生，等数据对象拆分后再统一设计统计口径。

建议顺序：

1. 评论对象设计。
2. 用户/作者对象设计。
3. 点赞收藏关系对象设计。
4. 统计对象设计。
5. 标签对象设计。
