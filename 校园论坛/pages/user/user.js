const mockUsers = require("../../utils/mock-users.js")
const forumStore = require("../../utils/forum-store.js")
const commentStore = require("../../utils/comment-store.js")
const profileNav = require("../../utils/profile-nav.js")

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
    const postData = forumStore.getPostData()
    const users = postData.users
    const posts = postData.posts || []

    const user = mockUsers.findUserById(users, authorId)

    if (user && user.isCurrentUser) {
      profileNav.goUserProfile({
        userId: authorId
      })
      return
    }

    if (!user) {
      const fallbackUser = this.createFallbackUser(authorId)

      if (!fallbackUser) {
        this.rejectUserPage("没有找到作者资料")
        return
      }

      wx.setNavigationBarTitle({
        title: fallbackUser.nickname
      })

      this.updateUserView(fallbackUser, [], posts)
      return
    }

    wx.setNavigationBarTitle({
      title: user.nickname
    })

    this.updateUserView(user, user.posts || [], posts)
  },

  updateUserView(user, authorPosts, posts) {
    const authorComments = this.getAuthorComments(user.userId, user.nickname, posts)
    const safeStats = Object.assign({}, user.stats || {}, {
      postCount: authorPosts.length,
      commentCount: authorComments.length
    })
    const safeUser = Object.assign({}, user, {
      stats: safeStats
    })

    this.setData({
      user: safeUser,
      authorPosts: authorPosts,
      authorComments: authorComments,
      emptyText: this.getEmptyText(this.data.activeTab)
    })
  },

  getAuthorComments(authorId, nickname, posts) {
    const postMap = this.createPostMap(posts)
    const comments = commentStore.getComments()

    return comments
      .filter(comment => this.isAuthorComment(comment, authorId, nickname))
      .map(comment => {
        const post = postMap[String(comment.postId)]
        const postAvailable = Boolean(post)

        return Object.assign({}, comment, {
          postTitle: postAvailable ? post.title : "原帖已不可用",
          postAvailable: postAvailable
        })
      })
  },

  createPostMap(posts) {
    const result = {}
    const list = Array.isArray(posts) ? posts : []

    list.forEach(post => {
      result[String(post.postId)] = post
    })

    return result
  },

  isAuthorComment(comment, authorId, nickname) {
    const targetId = String(authorId || "")
    const targetName = String(nickname || "").trim()
    const commentAuthorId = String(comment && comment.authorId || "")
    const commentAuthor = String(comment && comment.author || "").trim()

    if (commentAuthorId && commentAuthorId === targetId) {
      return !targetName || !commentAuthor || commentAuthor === targetName
    }

    return Boolean(targetName && commentAuthor && commentAuthor === targetName)
  },

  getEmptyText(tab) {
    return tab === "comments" ? "TA 还没有发表过评论" : "TA 还没有发布帖子"
  },

  createFallbackUser(authorId) {
    const nickname = this.data.fallbackNickname || ""
    const avatar = this.data.fallbackAvatar || ""

    if (!nickname && !avatar) {
      return null
    }

    return {
      userId: authorId,
      nickname: nickname || "校园用户",
      avatar: avatar || "/images/avatar/default.png",
      bio: "这位同学暂时还没有公开发布内容。",
      role: "student",
      roleName: "用户",
      department: "校园论坛",
      grade: "资料未完善",
      tags: ["校园用户"],
      isCurrentUser: false,
      status: "active",
      stats: {
        postCount: 0,
        viewCount: 0,
        likeCount: 0,
        collectCount: 0,
        commentCount: 0
      },
      relation: {
        isFollowing: false,
        isBlocked: false
      },
      posts: []
    }
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

    wx.navigateTo({
      url: "/pages/detail/detail?postId=" + postId
    })
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

    wx.navigateTo({
      url: "/pages/detail/detail?postId=" + postId
    })
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
