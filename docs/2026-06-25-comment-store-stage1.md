# 评论对象分离第一阶段改造记录

## 1. 本轮改造目标

本轮实现评论对象分离的第一阶段：新增独立评论存储层 `utils/comment-store.js`，新增本地缓存 key `forum_comments`，并支持从旧帖子对象中的 `post.comments` 迁移评论到独立评论缓存。

本轮只新增存储层和测试，不接入页面 UI。详情页仍继续使用 `post.comments` 展示和提交评论，旧帖子对象中的 `comments` 字段保留不变。

## 2. 新增文件

| 文件 | 作用 |
| --- | --- |
| `校园论坛/utils/comment-store.js` | 管理独立评论缓存 `forum_comments`；提供评论读取、保存、按帖子查询、旧评论迁移、评论字段归一化、按帖子统计有效评论数。 |
| `tests/utils/comment-store.test.js` | 使用 Node `assert` 验证评论迁移、重复迁移保护、按帖子读取、字段补齐、评论计数、空缓存和异常缓存兼容。 |
| `docs/2026-06-25-comment-store-stage1.md` | 记录本轮评论存储层第一阶段的实际改动。 |

## 3. 未修改内容

本轮没有修改以下内容：

* 未修改 `pages/detail/detail.js`。
* 未修改 `pages/detail/detail.wxml`。
* 未修改任何 WXSS。
* 未修改 tabBar。
* 未修改路由配置。
* 未新增回复功能。
* 未新增评论点赞功能。
* 未新增评论点踩功能。
* 未拆分用户对象。
* 未拆分帖子点赞收藏对象。
* 未拆分统计对象。
* 未清空 `forum_posts`。
* 未清空 `forum_my_posts`。
* 未清空用户已经发布、点赞、收藏、评论的数据。
* 未接入后端。
* 未引入第三方库。
* 未提交 git commit。

## 4. 新增本地缓存 key

| key | 存储内容 | 写入位置 |
| --- | --- | --- |
| `forum_comments` | 独立评论对象数组。评论从旧 `post.comments` 迁移而来，后续可作为评论独立存储入口。 | `utils/comment-store.js` |

当前已有缓存 key 保持不变：

| key | 状态 |
| --- | --- |
| `forum_posts` | 保留，不清空。页面仍通过帖子对象读取 `comments`。 |
| `forum_my_posts` | 保留，不清空。 |

## 5. `comment-store.js` 当前 API

```js
getComments()
```

说明：

* 参数：无。
* 返回值：评论数组。
* 作用：读取 `forum_comments`。如果缓存已经存在且是数组，只归一化并保存该数组，不再从帖子重复迁移；如果缓存不存在或不是数组，则从 `forumStore.getPosts()` 返回的帖子中读取 `post.comments` 并迁移。

```js
saveComments(comments)
```

说明：

* 参数：`comments`，评论数组。
* 返回值：归一化并去重后的评论数组。
* 作用：补齐评论默认字段，按 `postId + commentId` 去重，并写入 `forum_comments`。

```js
getCommentsByPostId(postId)
```

说明：

* 参数：`postId`，帖子 ID。
* 返回值：属于该帖子的评论数组。
* 作用：读取 `forum_comments` 后，按帖子 ID 过滤评论；ID 比较兼容数字和字符串。

```js
migrateCommentsFromPosts(posts)
```

说明：

* 参数：`posts`，帖子数组。
* 返回值：从 `post.comments` 迁移出的评论数组。
* 作用：遍历帖子中的旧评论，调用 `normalizeComment(comment, post)` 补齐字段，并按 `postId + commentId` 去重。该方法不会删除或修改旧帖子里的 `comments`。

```js
normalizeComment(comment, post)
```

说明：

* 参数：`comment`，旧评论对象；`post`，评论所属帖子对象，可选。
* 返回值：补齐字段后的评论对象。
* 作用：把旧评论补齐为第一阶段独立评论结构，至少包含 `commentId`、`postId`、`authorId`、`author`、`avatar`、`content`、`createdAt`、`date`、`parentCommentId`、`rootCommentId`、`level`、`likeCount`、`dislikeCount`、`isLiked`、`isDisliked`、`status`。

```js
getCommentCountByPostId(postId)
```

说明：

* 参数：`postId`，帖子 ID。
* 返回值：该帖子有效评论数量。
* 作用：读取对应帖子的评论，只统计 `status` 为空或 `status === "active"` 的评论。

## 6. 当前迁移规则

本轮实现的迁移规则如下：

1. `forum_comments` 已经存在且是数组时，`getComments()` 不会再从 `post.comments` 迁移。
2. `forum_comments` 不存在或不是数组时，`getComments()` 会调用 `forumStore.getPosts()`，再从返回帖子的 `comments` 字段迁移评论。
3. 迁移不会删除旧的 `post.comments` 字段。
4. 迁移不会清空 `forum_posts`。
5. 迁移不会清空 `forum_my_posts`。
6. 迁移时按 `postId + commentId` 去重，避免同一批旧评论重复写入。
7. 旧评论没有 `createdAt` 时，使用旧字段 `date` 作为 `createdAt`。
8. 旧评论没有 `authorId` 时：
   * 如果作者是 `当前用户`，使用 `current-user`。
   * 如果传入帖子有 `authorId`，使用帖子 `authorId`。
   * 否则根据评论作者名生成稳定兜底 ID。
9. 一级评论统一补齐 `parentCommentId: null`、`rootCommentId: null`、`level: 1`。
10. 评论互动字段统一补齐默认值：`likeCount: 0`、`dislikeCount: 0`、`isLiked: false`、`isDisliked: false`。
11. 评论状态默认补齐为 `status: "active"`。

## 7. 当前页面影响

本轮没有把 `comment-store` 接入页面，因此当前页面行为应保持原样：

* 详情页仍展示 `post.comments`。
* 详情页新增评论仍写回帖子对象。
* 首页热帖、搜索、分类、排序仍依赖帖子数据和 `commentCount`。
* 个人页“我的发布 / 我的收藏 / 我的点赞”仍使用帖子列表派生。
* 作者页统计仍由 `mock-users.js` 根据帖子数据计算。

`forum_comments` 当前是旁路缓存，用于为后续第二阶段切换详情页评论读取做准备。

## 8. 测试覆盖

新增测试 `tests/utils/comment-store.test.js` 覆盖：

* `forum_comments` 为空时，可以从带有 `post.comments` 的帖子迁移评论。
* 再次调用 `getComments()` 不会重复迁移。
* `getCommentsByPostId(postId)` 只返回对应帖子的评论。
* `normalizeComment()` 可以补齐旧评论缺失字段。
* `getCommentCountByPostId(postId)` 返回该帖子有效评论数量。
* 空评论数组不会报错。
* 缓存不存在不会报错。
* 缓存不是数组时不会报错，并会迁移为空数组或旧帖子评论。
* 同一帖子内重复 `commentId` 会去重。

## 9. 后续注意点

后续第二阶段如果要让详情页读取 `comment-store`，需要单独修改页面 JS 和 WXML，并重点验证：

* `post.commentCount` 与 `forum_comments` 的有效评论数量同步。
* 新增评论是否同时写入 `forum_comments` 并更新帖子 `commentCount`。
* 旧 `post.comments` 中用户已经提交的评论是否完整迁移。
* 作者统计和首页热度排序是否保持当前口径。
* 迁移逻辑是否幂等，不能重复生成模拟评论。

这些内容本轮未实现。
