# 评论对象分离设计方案

## 1. 当前评论结构

当前评论数据仍嵌套存储在帖子对象中，主要位置如下：

* 初始帖子数据来自 `校园论坛/data/forum-data.js` 的 `postList`。
* 每个帖子对象包含 `commentCount` 和 `comments` 字段。
* `comments` 当前是帖子对象内的数组，不是独立缓存表。
* 帖子数据统一通过 `校园论坛/utils/forum-store.js` 读取和归一化后写回 `forum_posts`。

当前单条评论对象主要字段来自两类来源。

模拟评论由 `校园论坛/utils/mock-comments.js` 生成，字段如下：

```js
{
  commentId: 1001,
  author: "小周",
  avatar: "/images/avatar/2.png",
  content: "模拟评论内容-1-1",
  date: "2026-06-01"
}
```

详情页用户新增评论由 `pages/detail/detail.js` 生成，字段如下：

```js
{
  commentId: Date.now(),
  author: "当前用户",
  avatar: "/images/avatar/default.png",
  content: text,
  date: this.getToday()
}
```

`commentCount` 当前用法：

* `data/forum-data.js` 中的初始帖子用 `commentCount` 表示评论数量，`comments` 初始为空数组。
* `mock-comments.fillMockComments(posts)` 会读取 `commentCount`。如果 `comments` 为空且 `commentCount > 0`，就生成对应数量的模拟评论。
* 如果 `comments.length > 0`，`mock-comments` 会把 `commentCount` 重置为 `comments.length`。
* `pages/detail/detail.wxml` 顶部统计栏展示 `post.commentCount`。
* `pages/detail/detail.wxml` 评论区标题展示 `post.comments.length`。
* `utils/post-filter.js` 的热度排序通过 `commentCount` 参与计算。
* `utils/mock-users.js` 的作者统计会优先使用 `post.comments.length`，没有评论数组时才使用 `post.commentCount`。

详情页新增评论流程：

1. `pages/detail/detail.js` 读取当前 `post`。
2. 用户输入评论后，`onSubmitComment()` 生成新评论对象。
3. 新评论通过 `comments.concat(newComment)` 追加到 `post.comments`。
4. `commentCount` 更新为 `newComments.length`。
5. 调用 `forumStore.updatePostById()` 将整个帖子对象写回 `forum_posts`。

## 2. 当前问题

当前评论嵌套在帖子对象中，短期适合本地演示，但继续扩展会出现这些问题：

* 评论和帖子强耦合：只要修改评论，就必须更新整个帖子对象并写回 `forum_posts`。
* `commentCount` 与 `comments.length` 可能不同步：详情页顶部用 `commentCount`，评论区用 `comments.length`，如果某个流程只更新其中一个，会出现展示差异。
* 模拟评论和用户真实评论边界不清楚：模拟评论、用户新增评论都进入同一个 `post.comments` 数组，后续很难判断评论来源。
* 不方便支持回复：当前评论只有一层数组，没有 `parentCommentId` 或层级关系。
* 不方便支持评论点赞 / 点踩：当前点赞收藏是帖子级字段，评论对象没有独立互动状态。
* 不方便支持楼中楼：如果把回复继续塞进评论对象的子数组，详情页渲染和更新会更复杂，且更难按 ID 更新单条回复。
* 不方便按作者统计评论：当前 `mock-users.js` 统计的是帖子收到的评论数，不是用户发出的评论数。
* 不方便删除或隐藏评论：当前没有 `status` 字段，无法区分正常、已删除、审核隐藏等状态。
* 不方便分页或懒加载：评论随帖子一起读写，评论数量变多后会让 `forum_posts` 变大。
* 不方便迁移到后端：后端通常会把帖子、评论、评论互动拆成不同资源，现在的嵌套结构会增加迁移成本。

## 3. 目标评论对象结构

建议后续新增独立评论对象，缓存层以 `forum_comments` 保存扁平数组。推荐结构如下：

```js
{
  commentId: "comment-1001",
  postId: 1,
  authorId: "user-abc",
  content: "这条复习建议很有用",
  createdAt: "2026-06-25 10:30:00",
  parentCommentId: null,
  rootCommentId: null,
  level: 1,
  likeCount: 0,
  dislikeCount: 0,
  isLiked: false,
  isDisliked: false,
  status: "active"
}
```

字段说明：

| 字段 | 作用 |
| --- | --- |
| `commentId` | 评论唯一 ID。建议后续使用字符串，避免与旧模拟数字 ID 混淆；迁移旧数据时可以转换为 `comment-${oldId}`。 |
| `postId` | 评论所属帖子 ID，用于按帖子查询评论。保留当前帖子 ID 类型兼容逻辑，不强制改变帖子 ID 类型。 |
| `authorId` | 评论作者 ID。当前可用 `mock-users.js` 生成的作者 ID 或当前用户 ID；暂不要求拆用户对象。 |
| `content` | 评论正文。 |
| `createdAt` | 评论创建时间。建议使用完整时间字符串或时间戳，替代当前只有日期的 `date`。 |
| `parentCommentId` | 直接回复的评论 ID。一级评论为 `null`。 |
| `rootCommentId` | 所属一级评论 ID。一级评论为 `null` 或自身 ID，建议迁移时统一为 `null`；回复统一指向一级评论 ID。 |
| `level` | 评论层级。一级评论为 `1`，回复为 `2`。如果后续不做无限层级，可以将所有回复都折叠为 `2`。 |
| `likeCount` | 评论点赞数。 |
| `dislikeCount` | 评论点踩数。 |
| `isLiked` | 当前用户是否已点赞该评论。 |
| `isDisliked` | 当前用户是否已点踩该评论。 |
| `status` | 评论状态。建议可选值：`active`、`deleted`、`hidden`。详情页默认只展示 `active`。 |

为兼容当前 UI，可以在读取评论时派生旧字段：

```js
{
  author: "当前用户",
  avatar: "/images/avatar/default.png",
  date: "2026-06-25"
}
```

这些展示字段可以由 `comment-store.js` 联合 `mock-users.js` 或当前用户默认信息生成，不建议长期作为评论主数据字段。

## 4. 评论回复结构设计

建议使用扁平评论数组，通过 `postId`、`parentCommentId`、`rootCommentId`、`level` 表达层级，而不是在评论对象中继续嵌套 `children`。

### 一级评论

一级评论直接属于帖子：

```js
{
  commentId: "comment-1-001",
  postId: 1,
  authorId: "user-xiaolin",
  content: "可以先复习集合和异常，再看 IO。",
  createdAt: "2026-06-25 09:10:00",
  parentCommentId: null,
  rootCommentId: null,
  level: 1,
  likeCount: 3,
  dislikeCount: 0,
  isLiked: false,
  isDisliked: false,
  status: "active"
}
```

### 回复一级评论

回复一级评论时，`parentCommentId` 指向被回复的一级评论，`rootCommentId` 也指向该一级评论：

```js
{
  commentId: "comment-1-002",
  postId: 1,
  authorId: "current-user",
  content: "我也觉得集合要先看，题目比较常见。",
  createdAt: "2026-06-25 09:18:00",
  parentCommentId: "comment-1-001",
  rootCommentId: "comment-1-001",
  level: 2,
  likeCount: 1,
  dislikeCount: 0,
  isLiked: true,
  isDisliked: false,
  status: "active"
}
```

### 回复某条回复

回复某条回复时，`parentCommentId` 指向被回复的那条回复，`rootCommentId` 仍指向所属一级评论。这样可以保留直接回复关系，同时让 UI 能把同一楼下的回复聚合在一起：

```js
{
  commentId: "comment-1-003",
  postId: 1,
  authorId: "user-muzi",
  content: "IO 可以最后看，先把异常处理写熟。",
  createdAt: "2026-06-25 09:25:00",
  parentCommentId: "comment-1-002",
  rootCommentId: "comment-1-001",
  level: 2,
  likeCount: 0,
  dislikeCount: 0,
  isLiked: false,
  isDisliked: false,
  status: "active"
}
```

说明：

* UI 如果暂时只支持两层展示，可以把所有 `level: 2` 的评论展示在一级评论下。
* 如果后续要显示“回复某某”，可以根据 `parentCommentId` 找到被回复评论的作者。
* 评论的评论也能点赞和点踩，因为每条评论都有独立的 `likeCount`、`dislikeCount`、`isLiked`、`isDisliked`。

### 某帖子完整示例

```js
[
  {
    commentId: "comment-1-001",
    postId: 1,
    authorId: "user-xiaolin",
    content: "可以先复习集合和异常，再看 IO。",
    createdAt: "2026-06-25 09:10:00",
    parentCommentId: null,
    rootCommentId: null,
    level: 1,
    likeCount: 3,
    dislikeCount: 0,
    isLiked: false,
    isDisliked: false,
    status: "active"
  },
  {
    commentId: "comment-1-002",
    postId: 1,
    authorId: "current-user",
    content: "我也觉得集合要先看，题目比较常见。",
    createdAt: "2026-06-25 09:18:00",
    parentCommentId: "comment-1-001",
    rootCommentId: "comment-1-001",
    level: 2,
    likeCount: 1,
    dislikeCount: 0,
    isLiked: true,
    isDisliked: false,
    status: "active"
  },
  {
    commentId: "comment-1-003",
    postId: 1,
    authorId: "user-muzi",
    content: "IO 可以最后看，先把异常处理写熟。",
    createdAt: "2026-06-25 09:25:00",
    parentCommentId: "comment-1-002",
    rootCommentId: "comment-1-001",
    level: 2,
    likeCount: 0,
    dislikeCount: 0,
    isLiked: false,
    isDisliked: false,
    status: "active"
  }
]
```

## 5. 本地缓存 key 设计

后续可以新增这些缓存 key：

| 缓存 key | 存储内容 | 说明 |
| --- | --- | --- |
| `forum_comments` | 评论对象数组 | 独立保存所有帖子评论。通过 `postId` 查询某个帖子的评论。 |
| `forum_comment_likes` | 当前用户点赞过的评论 ID 数组，或关系对象数组 | 如果只支持当前用户本地状态，可存 ID 数组；如果要保留时间，可存 `{ commentId, userId, createdAt }`。 |
| `forum_comment_dislikes` | 当前用户点踩过的评论 ID 数组，或关系对象数组 | 与点赞类似，用于维护点踩状态。 |

第一阶段建议先只新增 `forum_comments`。评论点赞和点踩可以先保留在评论对象字段上，等功能稳定后再考虑独立关系缓存。

如果后续需要更清晰的关系对象，可扩展为：

```js
{
  commentId: "comment-1-001",
  userId: "current-user",
  type: "like",
  createdAt: "2026-06-25 10:00:00"
}
```

但本次设计不建议同时拆用户对象、帖子点赞收藏关系和评论互动关系，避免一次迁移面过大。

## 6. 与帖子对象的关系

帖子对象建议短期保留以下评论相关字段：

* `commentCount`
* `comments`

但两者定位需要调整。

### `comments` 是否继续保留

第一阶段建议继续保留 `comments`，原因：

* 当前 `forum-store.js`、`mock-comments.js`、详情页 WXML 都依赖 `post.comments`。
* 旧缓存中已经可能存在用户新增评论。
* 直接移除会导致详情页和作者统计出现兼容风险。

迁移后期建议逐步废弃 `post.comments`：

* 新评论只写入 `forum_comments`。
* `post.comments` 仅作为旧数据迁移来源。
* 详情页展示评论时不再读取 `post.comments`。
* 完成迁移后，帖子对象不再保存完整评论数组。

### `commentCount` 是否继续保留

建议中期继续保留 `commentCount`，但把它定义为派生统计字段：

* 首页列表、个人页列表、作者页帖子列表和热度排序仍可直接读取 `post.commentCount`，避免每次列表渲染都扫描全部评论。
* `comment-store.js` 新增、删除、隐藏评论时，同步更新对应帖子的 `commentCount`。
* 如果后续评论数量较小，也可以在读取帖子列表时由 `forum_comments` 计算，但本地小程序环境下保留计数字段更简单。

### 详情页展示时如何根据 `postId` 获取评论

后续详情页建议流程：

1. `forumStore.findPostById(postId)` 读取帖子主体。
2. `commentStore.getCommentsByPostId(postId)` 读取该帖子评论。
3. `commentStore.buildCommentTree(comments)` 或页面内轻量分组，把扁平评论整理为一级评论和回复列表。
4. 页面渲染 `post` 和 `commentList`，不要再依赖 `post.comments`。

### 首页和个人页如何显示评论数量

首页、个人页、作者页可以继续使用帖子对象中的 `commentCount`：

* 首页热帖轮播和列表排序依赖 `post-filter.getHeat(post)`，其中评论权重来自 `commentCount`。
* 个人页和作者页列表可以继续展示帖子级评论数。
* 评论新增、删除、隐藏时，由 `comment-store` 或由详情页协调调用 `forum-store.updatePostById()` 同步计数。

## 7. 与 `forum-store.js` 的关系

后续建议新增：

* `校园论坛/utils/comment-store.js`

建议边界：

| 模块 | 职责 |
| --- | --- |
| `forum-store.js` | 只管理帖子主体、帖子列表缓存、我的发布 ID、帖子级统计字段。 |
| `comment-store.js` | 管理评论缓存、评论迁移、按帖子查询评论、新增评论、回复评论、评论点赞、评论点踩、评论状态。 |
| `pages/detail/detail.js` | 同时调用 `forum-store` 和 `comment-store`，负责把帖子主体和评论列表交给页面渲染。 |

建议 `comment-store.js` 初期 API：

```js
getComments()
getCommentsByPostId(postId)
addComment(comment)
replyComment(parentCommentId, comment)
updateCommentById(commentId, updater)
likeComment(commentId)
dislikeComment(commentId)
getCommentCountByPostId(postId)
migrateCommentsFromPosts(posts)
```

与 `forum-store.js` 的协作原则：

* `forum-store.js` 不直接生成新评论。
* `comment-store.js` 不直接改变帖子主体内容，例如标题、正文、分类、浏览数、帖子点赞收藏。
* 评论数量同步可以通过一个明确流程处理：详情页新增评论时先调用 `comment-store.addComment()`，再调用 `forum-store.updatePostById()` 更新 `commentCount`。
* 后续如果需要避免页面协调两个 store，可以新增一个薄服务层，例如 `utils/forum-service.js`，但第一阶段不建议增加额外层级。

## 8. 迁移方案

### 第一阶段：只新增 `comment-store.js`，保留帖子里的 `comments` 兼容旧数据

目标：

* 新增 `comment-store.js` 和 `forum_comments` 缓存。
* 不改变页面行为。
* 不删除 `post.comments`。
* 不清空旧缓存。

建议做法：

1. `comment-store.js` 首次读取 `forum_comments` 时，如果为空，则从 `forumStore.getPosts()` 的 `post.comments` 迁移评论。
2. 迁移时为旧评论补齐 `postId`、`authorId`、`createdAt`、`parentCommentId`、`rootCommentId`、`level`、`likeCount`、`dislikeCount`、`isLiked`、`isDisliked`、`status`。
3. 保留旧 `post.comments`，仅把它视为迁移来源和兼容字段。
4. 建议加测试覆盖：旧模拟评论迁移、用户新增评论迁移、空评论迁移。

### 第二阶段：详情页读取评论改为调用 `comment-store`

目标：

* 详情页评论列表从 `comment-store.getCommentsByPostId(postId)` 获取。
* 帖子主体仍从 `forum-store` 获取。
* 评论输入后写入 `forum_comments`。

建议做法：

1. `detail.js` 增加 `commentList` 数据字段。
2. `loadPost()` 继续读取帖子，同时读取评论列表。
3. `onSubmitComment()` 改为调用 `commentStore.addComment()`。
4. 新增评论后同步更新帖子 `commentCount`。
5. WXML 可以在这一阶段再切换为遍历 `commentList`，但要单独执行，避免与 store 新增混在同一改动里。

### 第三阶段：新增评论回复、点赞、点踩

目标：

* 在评论对象层支持一级评论、回复、评论点赞和评论点踩。
* 不拆帖子点赞收藏。
* 不拆用户对象。

建议做法：

1. 新增回复入口时，只新增详情页评论区相关逻辑，不影响帖子主体。
2. 回复评论时写入 `parentCommentId`、`rootCommentId`、`level`。
3. 点赞和点踩先更新评论对象上的 `likeCount`、`dislikeCount`、`isLiked`、`isDisliked`。
4. 如果要防止重复点赞点踩，再引入 `forum_comment_likes` 和 `forum_comment_dislikes`。

### 第四阶段：帖子里的 `comments` 逐渐废弃，只保留 `commentCount` 或由评论列表计算

目标：

* 详情页、个人页、作者页不再依赖 `post.comments`。
* `post.comments` 只作为旧缓存迁移兼容，不再写入新数据。
* 长期可选择仅保留 `commentCount`，或由 `forum_comments` 计算。

建议做法：

1. 确认所有页面不再读取 `post.comments`。
2. `forum-store.normalizePost()` 不再主动补模拟评论数组，只补 `commentCount` 默认值。
3. `mock-comments.js` 改为给 `comment-store` 提供初始评论，而不是写入帖子对象。
4. 旧缓存迁移完成后，可以逐步停止在帖子对象中保存 `comments`。

## 9. 风险点

* 评论数不同步：`forum_comments` 中的有效评论数量和帖子 `commentCount` 不一致，会影响详情页统计、首页展示和热度排序。
* 模拟评论重复生成：如果迁移逻辑没有记录已迁移状态，可能每次读取都从 `commentCount` 重复生成模拟评论。
* 旧缓存兼容问题：用户本地可能已有 `forum_posts`，其中 `comments` 已经包含用户新增评论，迁移时不能覆盖或丢失。
* 作者统计变化：`mock-users.js` 当前统计帖子收到的评论数；评论拆分后，如果统计口径变化，需要明确是“帖子收到评论数”还是“用户发出评论数”。
* 首页热度排序依赖 `commentCount`：`post-filter.getHeat(post)` 使用 `commentCount`，如果评论迁移后没有同步该字段，热帖排序会变化。
* 微信本地缓存数据结构变更导致旧数据异常：`forum_comments` 新增后，需要兼容缓存不存在、缓存不是数组、旧评论缺字段等情况。
* 评论 ID 冲突：旧模拟评论 ID 是数字拼接，新评论用 `Date.now()`。迁移为独立评论表后建议统一转换为字符串 ID，避免不同来源冲突。
* 时间字段不统一：旧评论用 `date`，新设计用 `createdAt`。迁移时要保留展示兼容字段或统一格式化。
* 当前 UI 只支持一级评论展示：引入回复后，WXML 和样式需要单独设计，不能只改数据层。
* 评论点赞点踩状态与数量不一致：如果同时维护 `likeCount`、`isLiked` 和关系缓存，必须定义单一写入入口。
* 不清空缓存的前提下迁移更复杂：需要幂等迁移，重复执行不能重复新增评论。

## 10. 推荐执行顺序

后续真正改代码时，建议按下面顺序推进：

1. 为 `comment-store.js` 写测试，先覆盖旧 `post.comments` 到 `forum_comments` 的迁移。
2. 新增 `comment-store.js`，只读写 `forum_comments`，不改页面。
3. 增加幂等迁移标记或去重规则，确保模拟评论不会重复迁移。
4. 让 `comment-store.getCommentsByPostId(postId)` 返回兼容当前详情页展示所需的字段，例如 `author`、`avatar`、`date`、`content`。
5. 将详情页评论读取切换到 `comment-store`，帖子主体仍由 `forum-store` 管理。
6. 将详情页新增评论切换到 `comment-store.addComment()`，并同步更新帖子 `commentCount`。
7. 验证首页列表、热帖轮播、详情页评论数、个人页和作者页统计是否保持一致。
8. 在评论读取稳定后，再设计回复 UI 和交互事件。
9. 增加回复评论能力，写入 `parentCommentId`、`rootCommentId` 和 `level`。
10. 增加评论点赞和点踩能力，先使用评论对象内字段维护状态。
11. 如需要更严格的互动关系，再新增 `forum_comment_likes` 和 `forum_comment_dislikes`。
12. 所有页面不再依赖 `post.comments` 后，再逐步废弃帖子对象内的 `comments` 字段。

本方案只描述后续设计，不包含本轮代码改动。
