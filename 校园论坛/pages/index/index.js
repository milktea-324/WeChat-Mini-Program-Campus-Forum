const forumData = require("../../data/forum-data.js")
const postFilter = require("../../utils/post-filter.js")
const postService = require("../../utils/post-service.js")
const forumStore = require("../../utils/forum-store.js")
const userStore = require("../../utils/user-store.js")
const profileNav = require("../../utils/profile-nav.js")
const routeNav = require("../../utils/route-nav.js")

const DEFAULT_AVATAR = "/images/avatar/default.png"

function toCount(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function buildPostCardDisplayView(cardView) {
  const stats = cardView.stats || {}
  const currentUserState = cardView.currentUserState || {}

  return Object.assign({}, cardView, {
    displayAuthorName: cardView.authorName || "",
    displayAuthorAvatar: cardView.authorAvatar || DEFAULT_AVATAR,
    displayCategoryName: cardView.categoryName || "",
    displayCoverUrl: cardView.coverUrl || "",
    displayViewCount: toCount(stats.viewCount),
    displayLikeCount: toCount(stats.likeCount),
    displayCollectCount: toCount(stats.collectCount),
    displayCommentCount: toCount(stats.commentCount),
    displayIsLiked: Boolean(currentUserState.isLiked),
    displayIsCollected: Boolean(currentUserState.isCollected),
    displayIsCurrentUser: Boolean(currentUserState.isMine)
  })
}

function getPostCardContext() {
  try {
    const users = userStore.getUsers()
    const currentUserRef = userStore.getCurrentUserRef()
    const currentUser = currentUserRef && currentUserRef.userId
      ? userStore.findUserById(currentUserRef.userId) || currentUserRef
      : null

    return {
      users: users,
      currentUser: currentUser
    }
  } catch (error) {
    return {
      users: [],
      currentUser: null
    }
  }
}

function buildPostCardDisplayList(posts) {
  const sourcePosts = Array.isArray(posts) ? posts : []
  const context = getPostCardContext()

  return postService.getPostCardViews({
    posts: sourcePosts,
    users: context.users,
    categories: forumData.categoryList,
    currentUser: context.currentUser
  }).map(buildPostCardDisplayView)
}

Page({
  data: {
    bannerList: [],
    categoryList: [],
    postList: [],
    showPostList: [],
    currentCategory: "全部",
    keyword: "",
    emptyText: "没有找到相关帖子",

    timeRangeIndex: 0,
    sortIndex: 0,
    timeRangeList: [],
    sortList: [],
    timeRangeNames: [],
    sortNames: []
  },

  onLoad() {
    this.initForumData()
    this.initSortOptions()
  },

  onShow() {
    this.loadPosts()
  },

  // 初始化排序选项
  initSortOptions() {
    const timeRangeList = postFilter.timeRangeList
    const sortList = postFilter.sortList

    this.setData({
      timeRangeList: timeRangeList,
      sortList: sortList,
      timeRangeNames: timeRangeList.map(item => item.label),
      sortNames: sortList.map(item => item.label)
    })
  },

  // 修改时间范围
  onTimeRangeChange(event) {
    this.setData({
      timeRangeIndex: Number(event.detail.value)
    })

    this.filterPosts()
  },

  // 修改排序条件
  onSortChange(event) {
    this.setData({
      sortIndex: Number(event.detail.value)
    })

    this.filterPosts()
  },

  // 初始化数据
  initForumData() {
    forumStore.getPosts()

    this.setData({
      categoryList: forumData.categoryList
    })
  },

  // 加载帖子
  loadPosts() {
    const posts = forumStore.getPosts()
    const hotBannerPosts = this.getHotBannerList(posts)

    this.setData({
      postList: posts,
      bannerList: buildPostCardDisplayList(hotBannerPosts)
    })

    this.filterPosts()
  },

  // 获取热度前三的帖子作为轮播图
  getHotBannerList(posts) {
    const list = posts.map(item => {
      return Object.assign({}, item, {
        _heat: postFilter.getHeat(item)
      })
    })

    list.sort((a, b) => {
      if (b._heat !== a._heat) {
        return b._heat - a._heat
      }

      const timeA = new Date((a.date || "").replace(/-/g, "/")).getTime() || 0
      const timeB = new Date((b.date || "").replace(/-/g, "/")).getTime() || 0

      return timeB - timeA
    })

    return list.slice(0, 3).map(item => {
      delete item._heat
      return item
    })
  },

  // 点击轮播图进入详情页
  onTapBanner(event) {
    const postId = event.currentTarget.dataset.postId

    if (!postId) {
      return
    }

    routeNav.goPostDetail(postId)
  },

  // 搜索输入
  onSearchInput(event) {
    this.setData({
      keyword: event.detail.value
    })

    this.filterPosts()
  },

  // 点击分类
  onTapCategory(event) {
    const category = event.currentTarget.dataset.category

    this.setData({
      currentCategory: category
    })

    this.filterPosts()
  },

  // 筛选和排序帖子
  filterPosts() {
    const {
      postList,
      currentCategory,
      keyword,
      timeRangeIndex,
      sortIndex,
      timeRangeList,
      sortList
    } = this.data

    const timeRange = timeRangeList[timeRangeIndex]
      ? timeRangeList[timeRangeIndex].value
      : "all"

    const sortType = sortList[sortIndex]
      ? sortList[sortIndex].value
      : "heat"

    const result = postFilter.filterAndSortPosts(postList, {
      category: currentCategory,
      keyword: keyword,
      timeRange: timeRange,
      sortType: sortType
    })

    this.setData({
      showPostList: buildPostCardDisplayList(result)
    })
  },

  // 点击帖子
  onTapPost(event) {
    const postId = event.currentTarget.dataset.postId

    routeNav.goPostDetail(postId)
  },

  // 点击作者头像进入作者主页
  onTapAuthor(event) {
    const dataset = event.currentTarget.dataset

    profileNav.goUserProfile({
      userId: dataset.authorId,
      nickname: dataset.authorName,
      avatar: dataset.avatar
    })
  }
})
