const mockUsers = require("../../utils/mock-users.js")
const forumStore = require("../../utils/forum-store.js")
const commentStore = require("../../utils/comment-store.js")
const profileService = require("../../utils/profile-service.js")
const profileNav = require("../../utils/profile-nav.js")
const routeNav = require("../../utils/route-nav.js")
const userStore = require("../../utils/user-store.js")

Page({
  data: {
    authorId: "",
    fallbackNickname: "",
    fallbackAvatar: "",
    activeTab: "posts",
    user: null,
    authorPosts: [],
    authorComments: [],
    emptyText: "TA 还没有发布帖子"
  },

  onLoad(options) {
    const authorId = options.authorId || ""
    const fallbackNickname = decodeOption(options.nickname || "")
    const fallbackAvatar = decodeOption(options.avatar || "")

    if (!authorId) {
      this.rejectUserPage("作者参数错误")
      return
    }

    if (authorId === mockUsers.CURRENT_USER_ID) {
      profileNav.goUserProfile({
        userId: authorId
      })
      return
    }

    this.setData({
      authorId: authorId,
      fallbackNickname: fallbackNickname,
      fallbackAvatar: fallbackAvatar
    })

    this.loadUser(authorId)
  },

  onShow() {
    if (this.data.authorId) {
      this.loadUser(this.data.authorId)
    }
  },

  // 加载作者资料和该作者发布的帖子
  loadUser(authorId) {
    const targetAuthorId = String(authorId || "")
    const storedUser = userStore.findUserById(targetAuthorId)
    const postData = forumStore.getPostData()
    const users = postData.users
    const posts = postData.posts || []
    const mockUser = mockUsers.findUserById(users, targetAuthorId)
    const targetUser = mockUser || storedUser
    const profileView = profileService.getUserProfileView(targetAuthorId, {
      posts: posts,
      comments: commentStore.getComments(),
      users: mergeReadUsers(users, storedUser),
      targetUser: targetUser,
      fallbackNickname: this.data.fallbackNickname,
      fallbackAvatar: this.data.fallbackAvatar
    })
    const profileState = profileView.state || {}
    const profileLists = profileView.lists || {}

    if (profileState.isCurrentUser) {
      profileNav.goUserProfile({
        userId: targetAuthorId
      })
      return
    }

    if (profileState.isMissingUser &&
      !targetUser &&
      !hasFallbackProfile(this.data.fallbackNickname, this.data.fallbackAvatar) &&
      !(profileLists.authorPosts && profileLists.authorPosts.length > 0)) {
      this.rejectUserPage("没有找到作者资料")
      return
    }

    const user = createPageUser(profileView.user, targetUser, targetAuthorId, profileView.stats)

    wx.setNavigationBarTitle({
      title: user.nickname
    })

    this.updateUserView(user, profileView)
  },

  updateUserView(user, profileView) {
    const profileLists = profileView.lists || {}

    this.setData({
      user: user,
      authorPosts: profileLists.authorPosts || [],
      authorComments: profileLists.authorComments || [],
      emptyText: this.getEmptyText(this.data.activeTab)
    })
  },

  getEmptyText(tab) {
    return tab === "comments" ? "TA 还没有发表过评论" : "TA 还没有发布帖子"
  },

  rejectUserPage(message) {
    wx.showToast({
      title: message || "没有找到作者资料",
      icon: "none"
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  },

  // 点击帖子进入详情页
  onTapPost(event) {
    const postId = event.currentTarget.dataset.postId

    routeNav.goPostDetail(postId)
  },

  onChangeTab(event) {
    const tab = event.currentTarget.dataset.tab

    if (tab !== "posts" && tab !== "comments") {
      return
    }

    this.setData({
      activeTab: tab,
      emptyText: this.getEmptyText(tab)
    })
  },

  onTapComment(event) {
    const postId = event.currentTarget.dataset.postId
    const available = event.currentTarget.dataset.available === true ||
      event.currentTarget.dataset.available === "true"

    if (!available) {
      wx.showToast({
        title: "原帖已不可用",
        icon: "none"
      })
      return
    }

    routeNav.goPostDetail(postId)
  },

  // 作者页内点击当前作者头像时留在当前页
  onTapAuthor(event) {
    const dataset = event.currentTarget.dataset

    profileNav.goUserProfile({
      userId: dataset.authorId,
      nickname: dataset.authorName,
      avatar: dataset.avatar
    })
  }
})

function decodeOption(value) {
  const text = String(value || "")

  if (!text) {
    return ""
  }

  try {
    return decodeURIComponent(text)
  } catch (error) {
    return text
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map(item => String(item || "").trim())
      .filter(item => item !== "")
  }

  const text = String(tags || "").trim()

  return text ? [text] : []
}

function hasFallbackProfile(nickname, avatar) {
  return Boolean(String(nickname || "").trim() || String(avatar || "").trim())
}

function mergeReadUsers(users, storedUser) {
  const result = Array.isArray(users) ? users.slice() : []
  const storedUserId = String(storedUser && storedUser.userId || "").trim()

  if (storedUserId && !result.some(user => String(user && user.userId || "") === storedUserId)) {
    result.push(storedUser)
  }

  return result
}

function createEmptyStats() {
  return {
    postCount: 0,
    viewCount: 0,
    likeCount: 0,
    collectCount: 0,
    commentCount: 0
  }
}

function createPageUser(profileUser, sourceUser, authorId, stats) {
  const baseUser = Object.assign(
    createDefaultUser(authorId),
    sourceUser || {},
    profileUser || {}
  )
  const safeStats = Object.assign(createEmptyStats(), baseUser.stats || {}, stats || {})

  return Object.assign({}, baseUser, {
    userId: baseUser.userId || authorId,
    nickname: baseUser.nickname || "校园用户",
    avatar: baseUser.avatar || "/images/avatar/default.png",
    roleName: baseUser.roleName || "用户",
    department: baseUser.department || "校园论坛",
    grade: baseUser.grade || "资料未完善",
    tags: normalizeTags(baseUser.tags),
    stats: safeStats,
    relation: baseUser.relation || {
      isFollowing: false,
      isBlocked: false
    }
  })
}

function createDefaultUser(authorId) {
  return {
    userId: authorId,
    nickname: "校园用户",
    avatar: "/images/avatar/default.png",
    bio: "这位同学暂时还没有公开发布内容。",
    role: "student",
    roleName: "用户",
    department: "校园论坛",
    grade: "资料未完善",
    tags: ["校园用户"],
    isCurrentUser: false,
    status: "active",
    stats: createEmptyStats(),
    relation: {
      isFollowing: false,
      isBlocked: false
    },
    posts: []
  }
}
