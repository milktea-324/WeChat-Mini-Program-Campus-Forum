# 校园论坛小程序当前状态交接文档

## 1. 项目定位

本项目是微信小程序期末作业，项目名称和页面定位为“校园论坛 / 校园生活圈”。当前版本是本地缓存版校园论坛，不接入 Spring Boot，不接入 MySQL，不依赖真实后端和数据库。

项目使用 `data/forum-data.js` 的本地初始数据，以及小程序 `wxStorage` 模拟论坛中的帖子、评论、我的发布等数据。当前目标是让本地版本尽量接近真实后端式的数据边界，例如帖子数据访问层、评论独立存储、用户主页跳转边界等，但不真正接入 Spring Boot / MySQL。

## 2. 当前页面结构

页面注册入口为 `校园论坛/app.json`。

| 页面 | 说明 | 当前功能 |
| --- | --- | --- |
| `pages/index/index` | 首页 | 展示帖子列表、热帖轮播、搜索、分类筛选、时间筛选和排序；点击帖子进入详情；点击作者头像进入用户主页。 |
| `pages/detail/detail` | 帖子详情页 | 展示帖子主体、封面、浏览/点赞/收藏/评论数；进入详情增加浏览数；支持点赞、收藏、一级评论新增；评论列表来自 `comment-store`；点击帖子作者或评论作者头像进入对应主页。 |
| `pages/publish/publish` | 发布页 | 支持填写标题、分类、正文、联系方式；可选择和删除帖子封面；发布后通过 `forum-store` 写入帖子并记录我的发布 ID。 |
| `pages/mine/mine` | 我的页 / 当前用户主页 | 当前用户自己的主页，展示我的发布、我的收藏、我的点赞、我的评论；帖子类 tab 支持搜索、分类、时间筛选和排序；评论 tab 可回到原帖。 |
| `pages/user/user` | 对外用户主页 | 其他用户主页，展示资料、统计、TA 的发布、TA 的评论；支持原帖不可用兜底；当前用户会被导向 `mine`。 |

项目中仍存在 `pages/logs/logs.*`，用于微信模板日志展示，但该页面没有注册在 `app.json` 页面列表中。

## 3. 当前核心功能

当前已经实现的功能包括：

* 首页帖子列表：通过 `forum-store.getPosts()` 获取归一化后的帖子数据。
* 热帖轮播：首页按 `post-filter.getHeat()` 计算热度，取前三条作为轮播。
* 搜索：支持按作者、标题、正文进行搜索匹配。
* 分类筛选：首页、我的页帖子列表支持按分类筛选。
* 时间筛选：支持全部时间、今天、近 7 天、近 30 天。
* 排序：支持默认热度、最新发布、最早发布、浏览量最高、点赞最多、收藏最多。
* 帖子详情：详情页展示帖子标题、作者、分类、正文、封面和统计数据。
* 浏览数：进入详情页时通过 `forumStore.updatePostById()` 增加浏览数。
* 点赞：详情页支持点赞 / 取消点赞，更新 `isLiked` 和 `like`。
* 收藏：详情页支持收藏 / 取消收藏，更新 `isCollected` 和 `collect`。
* 评论：详情页评论列表读取 `forum_comments`，新增评论写入 `comment-store`，并同步帖子 `commentCount`。
* 发布帖子：发布页创建新帖子，通过 `forumStore.addPost()` 写入 `forum_posts`。
* 选择帖子封面：发布页通过 `wx.chooseImage()` 和 `wx.saveFile()` 保存封面路径到 `postImg`。
* 我的发布：我的页通过 `isMine` 和 `forum_my_posts` 识别当前用户发布的帖子。
* 我的收藏：我的页根据 `isCollected` 展示收藏帖子。
* 我的点赞：我的页根据 `isLiked` 展示点赞帖子。
* 我的评论：我的页从 `comment-store` 读取当前用户评论，显示评论内容和原帖标题。
* 对外用户主页：`pages/user/user` 展示其他用户资料、统计、TA 的发布、TA 的评论。
* 对外主页的 TA 的发布 / TA 的评论：作者页有 `posts` 和 `comments` 两个 tab。
* 点击帖子作者头像进入用户主页：帖子列表、详情页作者头像均通过 `profile-nav` 跳转。
* 点击评论用户头像进入用户主页：详情页评论头像可进入当前用户 mine 或评论者对外主页。
* 当前用户头像进入 mine 页面：`profile-nav` 遇到 `current-user` 时使用 `wx.switchTab({ url: "/pages/mine/mine" })`。
* 作者页 / 详情页之间的页面栈边界处理：从作者页进入帖子详情后，再点击同一作者头像，会优先 `navigateBack`，避免无限嵌套。
* 空状态和展示兜底：帖子列表、评论列表、作者资料、原帖不可用等场景都有兜底文案或默认头像。
* 图标资源接入：已接入首页、排序、搜索、分类、浏览、点赞、收藏、评论、编辑、图片、空状态、tabBar 等图标资源。

## 4. 当前数据访问结构

| 文件 | 职责 |
| --- | --- |
| `utils/forum-store.js` | 帖子数据访问层。集中管理 `forum_posts` 和 `forum_my_posts`，负责初始化、归一化、保存、查找、更新、新增帖子，以及记录我的发布 ID。 |
| `utils/comment-store.js` | 评论数据访问层。集中管理 `forum_comments`，负责评论归一化、从旧 `post.comments` 迁移、读取、保存、按帖子查询、统计有效评论数、创建和新增一级评论。 |
| `utils/mock-users.js` | 模拟用户 / 作者信息。根据帖子作者推导 `authorId`、`authorInfo`、作者资料、作者统计和作者发布列表。当前用户 ID 为 `current-user`。 |
| `utils/mock-comments.js` | 模拟评论补齐。对旧帖子或初始帖子，根据 `commentCount` 生成模拟评论，并保留 `comments` 兼容字段。 |
| `utils/post-filter.js` | 筛选和排序。提供时间范围、排序选项、热度计算、模糊搜索、分类筛选、时间筛选和统一排序。 |
| `utils/profile-nav.js` | 用户主页跳转。统一处理当前用户去 mine、其他用户去 user、同页不重复跳转、上一层已有同作者主页时返回上一层。 |

当前约定：

* 页面不应直接大量读写 `forum_posts`。
* 帖子通过 `forum-store` 管理。
* 评论通过 `comment-store` 管理。
* 用户信息目前仍主要由 `mock-users` 和帖子作者信息推导。
* 用户主页跳转由 `profile-nav` 统一处理。

## 5. 当前本地缓存 key

当前实际使用的缓存 key：

| key | 使用位置 | 用途 |
| --- | --- | --- |
| `forum_posts` | `utils/forum-store.js` | 帖子主体数组，包含帖子内容、统计字段、互动状态、作者信息、兼容评论字段等。 |
| `forum_my_posts` | `utils/forum-store.js` | 当前用户发布过的帖子 ID 数组，用于我的页识别“我的发布”。 |
| `forum_comments` | `utils/comment-store.js` | 独立评论对象数组，详情页评论列表、我的评论、TA 的评论都从这里读取。 |
| `logs` | `app.js`、`pages/logs/logs.js` | 微信小程序模板遗留启动日志；`pages/logs` 当前未注册到 `app.json`。 |

## 6. 当前主要对象结构

### Post 帖子对象

帖子对象主要字段：

| 字段 | 类型定位 | 说明 |
| --- | --- | --- |
| `postId` | 原始字段 / 新增时生成 | 帖子 ID，初始数据为数字，发布页使用 `Date.now()`。 |
| `title` | 原始字段 | 标题。 |
| `content` | 原始字段 | 正文。发布页的联系方式当前会拼接到正文末尾。 |
| `category` | 原始字段 | 分类。 |
| `author` | 原始字段 / 运行时可能规范化 | 作者昵称。当前用户帖子显示为“当前用户”。 |
| `avatar` | 原始字段 / 运行时兜底 | 作者头像路径，缺失时兜底默认头像。 |
| `postImg` | 原始字段 / 运行时补齐 | 帖子封面，空字符串表示无封面。 |
| `date` | 原始字段 / 新增时生成 | 发布日期。 |
| `view` | 原始字段 / 运行时补齐 | 浏览数。 |
| `like` | 原始字段 / 运行时补齐 | 点赞数。 |
| `collect` | 原始字段 / 运行时补齐 | 收藏数。 |
| `commentCount` | 原始字段 / 运行时补齐 | 评论数量，是列表、热度、作者统计的主要口径。 |
| `isLiked` | 原始字段 / 运行时补齐 | 当前用户是否点赞。 |
| `isCollected` | 原始字段 / 运行时补齐 | 当前用户是否收藏。 |
| `isMine` | 原始字段 / 运行时补齐 | 是否当前用户发布。 |
| `comments` | 兼容字段 | 旧结构中的帖子内评论数组；当前仍保留，用于旧缓存兼容、模拟评论迁移和过渡镜像。 |
| `authorId` | 运行时补齐字段 | 由 `mock-users.js` 根据当前用户、已有作者 ID 或作者名 hash 生成。 |
| `authorInfo` | 运行时补齐字段 | 作者摘要信息，包含昵称、头像、简介、学院、年级、标签、状态等。 |

说明：

* 初始帖子字段主要来自 `data/forum-data.js`。
* `forum-store.normalizePostData()` 会补齐默认字段、模拟评论和作者信息。
* `comments` 当前仍作为兼容字段保留；详情页展示评论已经改为读取 `comment-store`。

### Comment 评论对象

评论对象主要字段：

| 字段 | 说明 |
| --- | --- |
| `commentId` | 评论 ID。旧模拟评论可能是数字，新评论默认使用 `Date.now()`。 |
| `postId` | 所属帖子 ID。 |
| `authorId` | 评论作者 ID。当前用户为 `current-user`，其他评论作者可由名称生成兜底 ID。 |
| `author` | 评论作者昵称。 |
| `avatar` | 评论作者头像。 |
| `content` | 评论正文。 |
| `createdAt` | 评论创建时间，旧数据没有时用 `date` 兜底。 |
| `date` | 页面展示用日期。 |
| `parentCommentId` | 父评论 ID，当前一级评论为 `null`。 |
| `rootCommentId` | 根评论 ID，当前一级评论为 `null`。 |
| `level` | 评论层级，当前一级评论为 `1`。 |
| `likeCount` | 评论点赞数，字段已预留。 |
| `dislikeCount` | 评论点踩数，字段已预留。 |
| `isLiked` | 当前用户是否点赞该评论，字段已预留。 |
| `isDisliked` | 当前用户是否点踩该评论，字段已预留。 |
| `status` | 评论状态，默认 `active`；有效评论统计只统计空状态或 `active`。 |

说明：

* 当前只实现一级评论展示与新增。
* 尚未实现评论回复。
* 尚未实现评论点赞 / 点踩。
* 评论已从帖子对象中拆出到 `forum_comments`。
* `post.comments` 仍作为兼容字段保留。

### User 用户 / 作者对象

当前用户对象还没有完全独立成 `forum_users`。当前用户资料、作者资料主要来自：

* 帖子作者字段：`author`、`avatar`、`authorId`。
* `mock-users.js`：根据帖子集合生成用户集合、作者统计、作者资料、作者发布列表。
* URL 兜底参数：`pages/user/user` 支持 `nickname`、`avatar` 兜底，用于评论作者这类没有发帖记录的用户主页。
* 当前用户默认资料：`mine` 页面默认昵称为“校园用户”，头像为 `/images/avatar/default.png`；评论新增时使用“当前用户”和默认头像。

说明：

* `mine` 页面是当前用户自己的主页。
* `user` 页面是其他用户的对外主页。
* 如果 `authorId === current-user`，`profile-nav` 会切换到 `pages/mine/mine`。
* 如果作者只有评论、没有帖子，作者页会根据 URL 中的昵称和头像创建兜底用户资料。

## 7. 当前页面关系和跳转规则

当前跳转规则：

* 首页帖子卡片点击进入详情页：`/pages/detail/detail?postId=...`。
* 帖子作者头像点击进入用户主页。
* 评论头像点击进入用户主页。
* 当前用户头像进入 `pages/mine/mine`，通过 `wx.switchTab` 进入 tabBar 页。
* 其他用户头像进入 `pages/user/user?authorId=...`，并尽量带上 `nickname`、`avatar` 作为兜底资料。
* 如果已经在同一作者主页，不重复跳转。
* 如果从作者页进入帖子详情，再点击同一作者头像，优先返回上一层作者页，避免页面栈无限嵌套。
* 作者页点击 TA 的评论可进入原帖详情；如果原帖不存在，提示“原帖已不可用”。
* 我的页点击我的评论可进入原帖详情；如果原帖不存在，提示“原帖已不可用”。

相关实现集中在 `utils/profile-nav.js`，页面只负责把 `userId`、`nickname`、`avatar` 传给 `profileNav.goUserProfile()`。

## 8. 当前测试文件与测试命令

当前测试文件：

* `tests/utils/forum-store.test.js`
* `tests/utils/comment-store.test.js`
* `tests/utils/mock-users.test.js`
* `tests/utils/profile-nav.test.js`
* `tests/pages/user-page.test.js`
* `tests/pages/mine-page.test.js`

推荐测试命令：

```text
node tests\utils\forum-store.test.js
node tests\utils\comment-store.test.js
node tests\utils\mock-users.test.js
node tests\utils\profile-nav.test.js
node tests\pages\user-page.test.js
node tests\pages\mine-page.test.js
node --check "校园论坛\pages\mine\mine.js"
node --check "校园论坛\pages\user\user.js"
node --check "校园论坛\pages\detail\detail.js"
```

建议额外补充的语法检查：

```text
node --check "校园论坛\pages\index\index.js"
node --check "校园论坛\pages\publish\publish.js"
node --check "校园论坛\utils\forum-store.js"
node --check "校园论坛\utils\comment-store.js"
node --check "校园论坛\utils\profile-nav.js"
node --check "校园论坛\utils\mock-users.js"
node --check "校园论坛\utils\mock-comments.js"
node --check "校园论坛\utils\post-filter.js"
```

## 9. 当前已知问题

1. 微信开发者工具偶发构建 / 缓存异常：
   * 曾出现 `module 'utils/comment-store.js' is not defined`，但文件实际存在，清缓存 / 重启开发者工具后恢复。
   * 曾出现清缓存重启后第一次构建失败，刷新后恢复；第二次清缓存重启正常。
   * 当前初步判断为开发者工具缓存或编译状态问题，不是稳定复现的业务代码问题。
2. 微信开发者工具 CLI 曾出现 `EEXIST` 异常，导致 Codex 无法可靠用 CLI 自动打开页面。
3. Git 在 Windows 下存在 LF 将转 CRLF 的提示，目前暂不处理。
4. 当前后端未接入，所有数据仍在本地缓存。
5. 当前没有真实登录，当前用户是模拟用户。
6. 用户对象尚未完全独立，没有 `forum_users` 或 `forum_current_user`。
7. 点赞 / 收藏关系尚未拆成独立关系表。
8. 评论回复、评论点赞、评论点踩尚未实现。
9. 标签系统尚未独立实现。

## 10. 当前不建议立即做的内容

当前不建议立即做：

* 不建议现在接 Spring Boot / MySQL。
* 不建议临近提交前大规模重构用户系统。
* 不建议一次性拆点赞、收藏、标签、统计、评论回复。
* 不建议清除兼容字段，例如 `post.comments`。
* 不建议为了开发者工具偶发缓存问题修改业务逻辑。

原因是当前项目已经进入期末展示和文档整理阶段，优先目标应是稳定演示、明确边界、补齐材料，而不是继续扩大数据结构改造范围。

## 11. 后续推荐开发路线

### 阶段 A：前端收尾与演示稳定

建议优先做：

* 清空缓存测试。
* 首次启动测试。
* 页面跳转测试。
* 发布、评论、点赞、收藏测试。
* 我的页四个 tab 测试。
* 对外主页两个 tab 测试。
* 空状态测试。
* 底部安全区测试。
* 准备演示流程。

这一阶段收益是直接提高期末展示稳定性；风险低，主要是发现并修复页面边界问题。

### 阶段 B：技术文档和期末材料

建议整理：

* 项目功能说明。
* 页面结构说明。
* 数据结构说明。
* 本地缓存设计说明。
* 核心代码说明。
* 测试流程说明。
* 已知问题说明。
* 后续可扩展方向。

这一阶段收益是让答辩材料完整、后续上下文交接清楚；风险低，不应改动业务代码。

### 阶段 C：本地后端式数据结构继续优化，谨慎推进

推荐顺序：

1. 用户对象独立化：新增 `user-store.js`、`forum_users`、`forum_current_user`。
   * 收益：用户资料、作者资料、当前用户资料有统一来源，评论作者不再依赖 URL 兜底。
   * 风险：会影响 mine、user、评论头像跳转、作者统计，改动面较大。
2. 点赞 / 收藏关系分离：新增 `forum_post_likes`、`forum_post_collects`。
   * 收益：更接近真实后端关系表，支持多用户互动数据。
   * 风险：会影响详情页、我的点赞、我的收藏、帖子统计和热度排序。
3. 标签对象设计：新增 `forum_tags`、`forum_post_tags`。
   * 收益：分类之外可支持多标签搜索和展示。
   * 风险：会影响发布页、列表筛选、搜索和帖子展示。
4. 评论回复设计，但不建议期末前强行实现。
   * 收益：评论系统更完整，可支持楼中楼或回复关系。
   * 风险：会影响评论对象结构、详情页 WXML/WXSS、评论数量统计和作者评论列表。

## 12. 给后续上下文窗口的工作原则

后续开发建议遵守：

* 每轮只做一个明确目标。
* Codex 修改前必须执行 `git status --short --untracked-files=all`。
* 工作区不干净时停止，除非用户明确说明是在上一轮未提交改动基础上继续。
* 不要自动提交。
* 不要使用 `git add .`。
* 每轮改动后必须输出：
  * 修改前 git 状态。
  * 修改后 git 状态。
  * `git diff --stat`。
  * 修改文件列表。
  * 测试结果。
  * 建议提交信息。
* 能不动 store 就不动 store。
* 能只改 WXML/WXSS 就不改 JS。
* 能先写只读分析就不要直接大改。
* 临近提交时优先稳定性、测试、文档，不做高风险功能。

## 13. 建议提交信息

建议提交信息：

```text
docs: 补充项目当前状态交接文档
```
