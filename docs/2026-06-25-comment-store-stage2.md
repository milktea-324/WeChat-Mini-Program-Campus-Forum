# 评论对象分离第二阶段改造记录

## 1. 本轮改造目标

本轮实现评论对象分离的第二阶段：让详情页评论读取和新增评论流程接入 `utils/comment-store.js`。

改造后，详情页帖子主体仍由 `forum-store` 管理；评论列表改为从 `forum_comments` 读取；提交新评论时，新评论写入 `forum_comments`，并同步更新帖子对象中的 `commentCount`。页面仍保留旧帖子对象中的 `comments` 字段作为兼容字段，不清空旧缓存，不删除旧数据。

本轮没有新增回复、评论点赞、评论点踩功能，也没有拆分用户对象、帖子点赞收藏对象或统计对象。

## 2. 修改文件

| 文件 | 改动内容 |
| --- | --- |
| `校园论坛/utils/comment-store.js` | 新增 `createComment()` 和 `addComment()`，用于创建一级评论对象并写入 `forum_comments`。 |
| `校园论坛/pages/detail/detail.js` | 新增 `commentList` 数据字段；加载详情页时从 `comment-store` 读取评论；提交评论时写入 `forum_comments`，再同步帖子 `commentCount` 和 `comments` 兼容字段。 |
| `校园论坛/pages/detail/detail.wxml` | 评论区从遍历 `post.comments` 改为遍历 `commentList`；评论区数量从 `post.comments.length` 改为 `commentList.length`。 |
| `tests/utils/comment-store.test.js` | 新增 `createComment()`、`addComment()` 测试，验证新评论对象字段、写入缓存、按帖子读取和评论计数。 |

## 3. 未修改内容

本轮没有修改以下内容：

* 没有修改首页。
* 没有修改发布页。
* 没有修改个人页。
* 没有修改作者页。
* 没有修改 WXSS。
* 没有修改 tabBar。
* 没有修改路由配置。
* 没有新增评论回复。
* 没有新增评论点赞。
* 没有新增评论点踩。
* 没有拆用户对象。
* 没有拆帖子点赞收藏对象。
* 没有拆统计对象。
* 没有清空 `forum_posts`。
* 没有清空 `forum_my_posts`。
* 没有清空 `forum_comments`。
* 没有接入后端。
* 没有引入第三方库。
* 没有提交 git commit。

## 4. `comment-store.js` API 变化

本轮新增两个方法。

```js
createComment(postId, content, authorInfo)
```

说明：

* 参数：
  * `postId`：评论所属帖子 ID。
  * `content`：评论正文。
  * `authorInfo`：评论作者信息，可包含 `authorId`、`author`、`avatar`、`date`、`createdAt`、`commentId`。
* 返回值：补齐后的一级评论对象。
* 作用：创建符合当前独立评论结构的一级评论，默认补齐 `parentCommentId: null`、`rootCommentId: null`、`level: 1`、`likeCount: 0`、`dislikeCount: 0`、`isLiked: false`、`isDisliked: false`、`status: "active"`。
* 当前调用位置：`pages/detail/detail.js`、`tests/utils/comment-store.test.js`。

```js
addComment(comment)
```

说明：

* 参数：`comment`，待写入的评论对象。
* 返回值：归一化后的评论对象。
* 作用：读取当前 `forum_comments`，追加新评论，复用 `saveComments()` 归一化和去重后写回本地缓存。
* 当前调用位置：`pages/detail/detail.js`、`tests/utils/comment-store.test.js`。

本轮未新增回复、点赞、点踩相关 API。

## 5. 详情页当前数据流

### 加载帖子

详情页加载时：

1. `pages/detail/detail.js` 继续通过 `forumStore.updatePostById(postId, updater)` 或 `forumStore.findPostById(postId)` 获取帖子主体。
2. 首次打开详情页时，浏览数仍由 `forum-store` 增加。
3. 读取到帖子后，调用 `refreshPostComments(post)`。
4. `refreshPostComments(post)` 调用 `commentStore.getCommentsByPostId(postId)` 获取独立评论列表。
5. 页面同时设置：
   * `post`：帖子主体。
   * `commentList`：独立评论列表。

### 展示评论

详情页 WXML 当前使用：

```wxml
{{commentList.length}}
wx:for="{{commentList}}"
```

不再直接用 `post.comments` 渲染评论区。

### 提交评论

详情页提交评论时：

1. 校验 `commentText` 不能为空。
2. 调用 `commentStore.createComment(postId, text, authorInfo)` 创建当前用户评论。
3. 调用 `commentStore.addComment(newComment)` 写入 `forum_comments`。
4. 调用 `commentStore.getCommentsByPostId(postId)` 获取当前帖子最新评论列表。
5. 调用 `commentStore.getCommentCountByPostId(postId)` 获取有效评论数。
6. 调用 `forumStore.updatePostById(postId, updater)` 同步帖子：
   * `commentCount` 更新为有效评论数。
   * `comments` 更新为当前独立评论列表，用作旧数据兼容字段。
7. 清空 `commentText`。
8. 调用 `refreshPostComments(updatedPost)` 刷新详情页评论列表。

## 6. 为什么仍同步 `post.comments`

虽然详情页已经不再通过 `post.comments` 渲染评论，但本轮仍会在提交新评论后同步帖子对象中的 `comments` 字段。

原因：

* `forum-store` 当前归一化帖子时仍会通过 `mock-comments.fillMockComments(posts)` 处理 `comments` 和 `commentCount`。
* 如果只更新 `commentCount`，但不更新 `comments`，旧的 `comments.length` 可能在后续保存时覆盖 `commentCount`。
* `mock-users.js` 的作者统计当前会优先使用 `post.comments.length`，没有评论数组时才使用 `post.commentCount`。
* 首页热度排序和帖子卡片仍依赖帖子对象上的 `commentCount`。

因此，第二阶段的策略是：

* 详情页渲染来源切换到 `commentList`。
* `forum_comments` 成为新增评论的主写入位置。
* `post.comments` 暂时作为兼容镜像保留，避免破坏现有统计和排序链路。

## 7. 当前缓存 key 使用情况

| key | 当前用途 |
| --- | --- |
| `forum_comments` | 独立评论对象数组。详情页评论列表和新增评论已经接入该 key。 |
| `forum_posts` | 帖子主体数组。仍保存帖子标题、正文、浏览、点赞、收藏、`commentCount` 和 `comments` 兼容字段。 |
| `forum_my_posts` | 当前用户发布过的帖子 ID 数组，本轮未改动。 |

## 8. 测试结果

本轮已运行并通过：

```text
node tests\utils\comment-store.test.js
node tests\utils\forum-store.test.js
node tests\utils\mock-users.test.js
node --check "校园论坛\utils\comment-store.js"
node --check "校园论坛\utils\forum-store.js"
node --check "校园论坛\pages\detail\detail.js"
```

未执行微信开发者工具人工测试。

建议人工确认：

* 打开已有评论的帖子，旧评论能显示。
* 提交新评论后，评论立即显示。
* 返回首页再进入详情页，新评论仍存在。
* 详情页顶部评论数和评论区标题数量一致。
* 首页帖子卡片评论数同步更新。
* 我的页和作者页没有明显异常。
* 点赞、收藏、浏览数仍正常。
* 反复进入同一详情页，评论不会重复增加。
* 清空小程序缓存后重新编译，初始模拟评论仍能正常显示。

## 9. 当前 git diff 摘要

本轮完成后的 `git diff --stat`：

```text
tests/utils/comment-store.test.js                  | 44 +++++++++++++++++++
校园论坛/pages/detail/detail.js                    | 47 +++++++++++++-------
校园论坛/pages/detail/detail.wxml                  |  6 +--
校园论坛/utils/comment-store.js                    | 51 +++++++++++++++++++++-
4 files changed, 129 insertions(+), 19 deletions(-)
```

## 10. 后续建议

后续如果继续推进评论对象分离，建议先处理这些问题：

1. 调整 `forum-store` 的评论数量归一化逻辑，减少对 `post.comments.length` 的依赖。
2. 调整 `mock-users.js` 作者统计口径，让作者统计可以直接使用 `commentCount` 或独立评论表统计。
3. 等详情页和列表页都稳定后，再逐步废弃帖子对象中的 `comments` 字段。
4. 评论回复、评论点赞、评论点踩应作为后续独立阶段，不建议与当前阶段混在一起。

## 11. 建议提交信息

建议提交信息：

```text
feat: 详情页评论接入独立评论存储
```

如果拆分 commit，建议拆成：

1. `feat: 补充评论存储新增评论 API`
2. `feat: 详情页评论读取切换到 comment-store`
