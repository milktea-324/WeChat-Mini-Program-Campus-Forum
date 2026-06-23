const forumData = require("../../data/forum-data.js")

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
    let posts = wx.getStorageSync("forum_posts")

    // 如果用户直接打开详情页，缓存里可能还没有数据
    if (!posts || posts.length === 0) {
      posts = forumData.postList || []
    }

    // 兼容旧数据：如果之前首页数据里没有 isLiked、comments 等字段，这里自动补上
    posts = posts.map(item => {
      const safeItem = Object.assign({
        view: 0,
        like: 0,
        collect: 0,
        commentCount: 0,
        isLiked: false,
        isCollected: false,
        comments: []
      }, item)

      if (!safeItem.comments) {
        safeItem.comments = []
      }

      if (safeItem.commentCount === undefined || safeItem.commentCount === null) {
        safeItem.commentCount = safeItem.comments.length
      }

      return safeItem
    })

    const index = posts.findIndex(item => Number(item.postId) === Number(this.data.postId))

    if (index === -1) {
      wx.showToast({
        title: "没有找到该帖子",
        icon: "none"
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 800)

      return
    }

    if (addView) {
      posts[index].view = Number(posts[index].view || 0) + 1
    }

    posts[index].commentCount = posts[index].comments.length

    wx.setStorageSync("forum_posts", posts)

    this.setData({
      post: posts[index]
    })
  },

  // 更新当前帖子并写回缓存
  updateCurrentPost(newPost) {
    const posts = wx.getStorageSync("forum_posts") || []
    const index = posts.findIndex(item => Number(item.postId) === Number(this.data.postId))

    if (index === -1) {
      return
    }

    posts[index] = newPost

    wx.setStorageSync("forum_posts", posts)

    this.setData({
      post: newPost
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
  }
})