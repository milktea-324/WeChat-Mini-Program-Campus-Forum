const mockUsers = require("../../utils/mock-users.js")
const forumStore = require("../../utils/forum-store.js")
const commentStore = require("../../utils/comment-store.js")
const profileNav = require("../../utils/profile-nav.js")
const userStore = require("../../utils/user-store.js")

const DEFAULT_CURRENT_USER = {
  userId: "current-user",
  nickname: "\u5f53\u524d\u7528\u6237",
  avatar: "/images/avatar/default.png"
}

function getSafeCurrentUser() {
  try {
    const currentUser = userStore.getCurrentUser()
    const userId = String(currentUser && currentUser.userId || "").trim()
    const nickname = String(currentUser && currentUser.nickname || "").trim()
    const avatar = String(currentUser && currentUser.avatar || "").trim()

    return {
      userId: userId || DEFAULT_CURRENT_USER.userId,
      nickname: nickname || DEFAULT_CURRENT_USER.nickname,
      avatar: avatar || DEFAULT_CURRENT_USER.avatar
    }
  } catch (error) {
    return DEFAULT_CURRENT_USER
  }
}

Page({
  data: {
    postId: null,
    post: null,
    commentList: [],
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

    this.refreshPostComments(post)
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

  // 刷新当前帖子的独立评论列表
  refreshPostComments(post) {
    const targetPost = post || this.data.post

    if (!targetPost) {
      return
    }

    const commentList = commentStore.getCommentsByPostId(this.data.postId)

    this.setData({
      post: targetPost,
      commentList: commentList
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

    const currentUser = getSafeCurrentUser()

    const newComment = commentStore.createComment(this.data.postId, text, {
      authorId: currentUser.userId,
      author: currentUser.nickname,
      avatar: currentUser.avatar,
      date: this.getToday()
    })

    commentStore.addComment(newComment)

    const nextComments = commentStore.getCommentsByPostId(this.data.postId)
    const commentCount = commentStore.getCommentCountByPostId(this.data.postId)
    const updatedPost = forumStore.updatePostById(this.data.postId, item => {
      return Object.assign({}, item, {
        comments: nextComments,
        commentCount: commentCount
      })
    })

    this.setData({
      commentText: ""
    })

    this.refreshPostComments(updatedPost || post)

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
    const dataset = event.currentTarget.dataset

    profileNav.goUserProfile({
      userId: dataset.authorId,
      nickname: dataset.authorName,
      avatar: dataset.avatar
    })
  },

  // 点击评论作者头像进入主页
  onTapCommentAuthor(event) {
    const commentId = event.currentTarget.dataset.commentId
    const comment = this.findCommentById(commentId)

    if (!comment) {
      return
    }

    profileNav.goUserProfile(this.getCommentProfileTarget(comment))
  },

  findCommentById(commentId) {
    const list = this.data.commentList || []

    return list.find(item => String(item.commentId) === String(commentId)) || null
  },

  getCommentProfileTarget(comment) {
    const author = String(comment.author || "").trim()
    let userId = comment.authorId || ""

    if (author === "当前用户" || userId === mockUsers.CURRENT_USER_ID) {
      userId = mockUsers.CURRENT_USER_ID
    } else if (!userId || this.isPostAuthorIdFromOtherCommentAuthor(comment)) {
      userId = "comment-author-" + hashString(author || comment.commentId)
    }

    return {
      userId: userId,
      nickname: author,
      avatar: comment.avatar
    }
  },

  isPostAuthorIdFromOtherCommentAuthor(comment) {
    const post = this.data.post

    if (!post || !comment || !post.authorId || !comment.authorId) {
      return false
    }

    return String(comment.authorId) === String(post.authorId) &&
      String(comment.author || "") !== String(post.author || "")
  }
})

function hashString(text) {
  const value = String(text || "")
  let hash = 0

  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}
