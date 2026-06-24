const forumData = require("../../data/forum-data.js")
const mockComments = require("../../utils/mock-comments.js")
const mockUsers = require("../../utils/mock-users.js")

Page({
  data: {
    authorId: "",
    user: null,
    authorPosts: [],
    emptyText: "这个作者还没有发布帖子"
  },

  onLoad(options) {
    const authorId = options.authorId || ""

    if (!authorId || authorId === mockUsers.CURRENT_USER_ID) {
      this.rejectUserPage()
      return
    }

    this.setData({
      authorId: authorId
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
    let posts = wx.getStorageSync("forum_posts")

    if (!posts || posts.length === 0) {
      posts = forumData.postList || []
    }

    posts = mockComments.fillMockComments(posts)

    const userResult = mockUsers.fillMockUsers(posts)
    const users = userResult.users

    posts = userResult.posts
    wx.setStorageSync("forum_posts", posts)

    const user = mockUsers.findUserById(users, authorId)

    if (!user || user.isCurrentUser) {
      this.rejectUserPage()
      return
    }

    wx.setNavigationBarTitle({
      title: user.nickname
    })

    this.setData({
      user: user,
      authorPosts: user.posts,
      emptyText: user.nickname + "还没有发布帖子"
    })
  },

  rejectUserPage() {
    wx.showToast({
      title: "不能进入自己的作者页",
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

  // 作者页内点击当前作者头像时留在当前页
  onTapAuthor(event) {
    const authorId = event.currentTarget.dataset.authorId
    const isCurrentUser = event.currentTarget.dataset.isCurrentUser === true ||
      event.currentTarget.dataset.isCurrentUser === "true"

    if (!authorId || authorId === this.data.authorId) {
      return
    }

    if (isCurrentUser || authorId === mockUsers.CURRENT_USER_ID) {
      wx.showToast({
        title: "不能进入自己的作者页",
        icon: "none"
      })
      return
    }

    const url = mockUsers.getAuthorProfileUrl({
      userId: authorId
    })

    if (!url) {
      return
    }

    wx.navigateTo({
      url: url
    })
  }
})
