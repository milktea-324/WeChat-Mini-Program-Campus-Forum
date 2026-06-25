const mockUsers = require("../../utils/mock-users.js")
const forumStore = require("../../utils/forum-store.js")

Page({
  data: {
    postId: null,
    post: null,
    commentText: ""
  },

  onLoad(options) {
    const postId = Number(options.postId)

    if (!postId) {
      wx.showToast({
        title: "帖子参数错误",
        icon: "none"
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 800)

      return
    }

    this.setData({
      postId: postId
    })

    this.loadPost(true)
  },

  // 加载当前帖子
  loadPost(addView) {
    let post = null

    if (addView) {
      post = forumStore.updatePostById(this.data.postId, item => {
        return Object.assign({}, item, {
          view: Number(item.view || 0) + 1
        })
      })
    } else {
      post = forumStore.findPostById(this.data.postId)
    }

    if (!post) {
      wx.showToast({
        title: "没有找到该帖子",
        icon: "none"
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 800)

      return
    }

    this.setData({
      post: post
    })
  },

  // 更新当前帖子并写回缓存
  updateCurrentPost(newPost) {
    const post = forumStore.updatePostById(this.data.postId, () => newPost)

    if (!post) {
      return
    }

    this.setData({
      post: post
    })
  },

  // 点赞 / 取消点赞
  onTapLike() {
    const post = this.data.post

    if (!post) {
      return
    }

    const isLiked = !post.isLiked
    let like = Number(post.like || 0)

    if (isLiked) {
      like += 1
    } else {
      like = Math.max(like - 1, 0)
    }

    const newPost = Object.assign({}, post, {
      isLiked: isLiked,
      like: like
    })

    this.updateCurrentPost(newPost)
  },

  // 收藏 / 取消收藏
  onTapCollect() {
    const post = this.data.post

    if (!post) {
      return
    }

    const isCollected = !post.isCollected
    let collect = Number(post.collect || 0)

    if (isCollected) {
      collect += 1
    } else {
      collect = Math.max(collect - 1, 0)
    }

    const newPost = Object.assign({}, post, {
      isCollected: isCollected,
      collect: collect
    })

    this.updateCurrentPost(newPost)

    wx.showToast({
      title: isCollected ? "已收藏" : "已取消收藏",
      icon: "none"
    })
  },

  // 评论输入
  onCommentInput(event) {
    this.setData({
      commentText: event.detail.value
    })
  },

  // 提交评论
  onSubmitComment() {
    const text = this.data.commentText.trim()

    if (text === "") {
      wx.showToast({
        title: "评论不能为空",
        icon: "none"
      })
      return
    }

    const post = this.data.post

    if (!post) {
      return
    }

    const comments = post.comments || []

    const newComment = {
      commentId: Date.now(),
      author: "当前用户",
      avatar: "/images/avatar/default.png",
      content: text,
      date: this.getToday()
    }

    const newComments = comments.concat(newComment)

    const newPost = Object.assign({}, post, {
      comments: newComments,
      commentCount: newComments.length
    })

    this.updateCurrentPost(newPost)

    this.setData({
      commentText: ""
    })

    wx.showToast({
      title: "评论成功",
      icon: "success"
    })
  },

  // 获取当前日期
  getToday() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return year + "-" + month + "-" + day
  },

  // 点击作者头像进入作者主页
  onTapAuthor(event) {
    const authorId = event.currentTarget.dataset.authorId
    const isCurrentUser = event.currentTarget.dataset.isCurrentUser === true ||
      event.currentTarget.dataset.isCurrentUser === "true"

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
