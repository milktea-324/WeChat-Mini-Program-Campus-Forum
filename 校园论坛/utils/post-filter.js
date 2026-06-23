// utils/post-filter.js

// 时间范围选项
const timeRangeList = [
  { label: "全部时间", value: "all" },
  { label: "今天", value: "today" },
  { label: "近7天", value: "week" },
  { label: "近30天", value: "month" }
]

// 排序选项
const sortList = [
  { label: "默认排序", value: "heat" },
  { label: "最新发布", value: "time_desc" },
  { label: "最早发布", value: "time_asc" },
  { label: "浏览量最高", value: "view" },
  { label: "点赞最多", value: "like" },
  { label: "收藏最多", value: "collect" }
]

// 计算热度
function getHeat(post) {
  const view = Number(post.view || 0)
  const like = Number(post.like || 0)
  const collect = Number(post.collect || 0)
  const commentCount = Number(post.commentCount || 0)

  // 浏览权重最低；点赞、评论、收藏权重更高
  return view * 1 + like * 5 + commentCount * 6 + collect * 8
}

// 日期转时间戳
function getPostTime(post) {
  const date = post.date || ""
  const time = new Date(date.replace(/-/g, "/")).getTime()

  if (isNaN(time)) {
    return 0
  }

  return time
}

// 判断是否在时间范围内
function isInTimeRange(post, timeRange) {
  if (!timeRange || timeRange === "all") {
    return true
  }

  const postTime = getPostTime(post)

  if (!postTime) {
    return false
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  if (timeRange === "today") {
    return postTime >= todayStart
  }

  const oneDay = 24 * 60 * 60 * 1000

  if (timeRange === "week") {
    return postTime >= todayStart - 6 * oneDay
  }

  if (timeRange === "month") {
    return postTime >= todayStart - 29 * oneDay
  }

  return true
}

// 模糊匹配：关键词中的字符按顺序出现在文本中即可
function fuzzyMatch(text, key) {
  text = String(text || "").toLowerCase()
  key = String(key || "").toLowerCase()

  let index = 0

  for (let i = 0; i < text.length; i++) {
    if (text[i] === key[index]) {
      index++
    }

    if (index >= key.length) {
      return true
    }
  }

  return false
}

// 计算搜索匹配分数
function getSearchScore(post, keyword) {
  const keyText = String(keyword || "").trim()

  if (keyText === "") {
    return 0
  }

  const keys = keyText.split(/\s+/).filter(item => item !== "")

  if (keys.length === 0) {
    return 0
  }

  const fields = [
    { name: "author", value: post.author || "", weight: 300 },
    { name: "title", value: post.title || "", weight: 200 },
    { name: "content", value: post.content || "", weight: 100 }
  ]

  let totalScore = 0
  let matched = false

  keys.forEach((key, keyIndex) => {
    const lowerKey = key.toLowerCase()

    // 越靠前的搜索词权重越高
    const keyWeight = (keys.length - keyIndex) * 1000

    fields.forEach(field => {
      const fieldText = String(field.value || "")
      const lowerText = fieldText.toLowerCase()

      // 精准匹配：字段内容与关键词完全相同
      if (lowerText === lowerKey) {
        totalScore += keyWeight + field.weight + 500
        matched = true
        return
      }

      // 连续包含：比普通模糊匹配更高
      if (lowerText.includes(lowerKey)) {
        totalScore += keyWeight + field.weight + 200
        matched = true
        return
      }

      // 模糊匹配
      if (fuzzyMatch(lowerText, lowerKey)) {
        totalScore += keyWeight + field.weight + 50
        matched = true
      }
    })
  })

  if (!matched) {
    return -1
  }

  return totalScore
}

// 主筛选排序函数
function filterAndSortPosts(posts, options) {
  options = options || {}

  const category = options.category || "全部"
  const keyword = options.keyword || ""
  const timeRange = options.timeRange || "all"
  const sortType = options.sortType || "heat"

  let result = posts.map(item => {
    return Object.assign({
      view: 0,
      like: 0,
      collect: 0,
      commentCount: 0,
      isLiked: false,
      isCollected: false,
      isMine: false,
      comments: [],
      postImg: ""
    }, item)
  })

  // 分类筛选
  if (category !== "全部") {
    result = result.filter(item => item.category === category)
  }

  // 时间范围筛选
  result = result.filter(item => isInTimeRange(item, timeRange))

  // 搜索筛选
  result = result.map(item => {
    return Object.assign({}, item, {
      _searchScore: getSearchScore(item, keyword)
    })
  })

  if (keyword.trim() !== "") {
    result = result.filter(item => item._searchScore >= 0)
  }

  // 排序
  result.sort((a, b) => {
    // 有搜索词时，先按搜索匹配分数排序
    if (keyword.trim() !== "" && b._searchScore !== a._searchScore) {
      return b._searchScore - a._searchScore
    }

    if (sortType === "time_desc") {
      return getPostTime(b) - getPostTime(a)
    }

    if (sortType === "time_asc") {
      return getPostTime(a) - getPostTime(b)
    }

    if (sortType === "view") {
      return Number(b.view || 0) - Number(a.view || 0)
    }

    if (sortType === "like") {
      return Number(b.like || 0) - Number(a.like || 0)
    }

    if (sortType === "collect") {
      return Number(b.collect || 0) - Number(a.collect || 0)
    }

    // 默认排序：热度排序
    const heatDiff = getHeat(b) - getHeat(a)

    if (heatDiff !== 0) {
      return heatDiff
    }

    // 热度相同时，发布时间新的在前
    return getPostTime(b) - getPostTime(a)
  })

  return result.map(item => {
    delete item._searchScore
    return item
  })
}

module.exports = {
  timeRangeList,
  sortList,
  filterAndSortPosts,
  getHeat
}