// utils/mock-comments.js

const mockAuthors = [
  "阿明", "小周", "木子", "南风", "七月",
  "白露", "清欢", "川柏", "知夏", "洛川",
  "寒舟", "林恩", "墨青", "青岚", "时雨",
  "闻舟", "云深", "槐序", "晚星", "小林"
]

// 生成单条模拟评论
function createMockComment(postId, index, date) {
  const authorIndex = (postId + index) % mockAuthors.length

  return {
    commentId: Number(String(postId) + String(index + 1).padStart(3, "0")),
    author: mockAuthors[authorIndex],
    avatar: "/images/avatar/" + ((authorIndex % 20) + 1) + ".png",
    content: "模拟评论内容-" + postId + "-" + (index + 1),
    date: date || "2026-06-20"
  }
}

// 给帖子补全评论
function fillMockComments(posts) {
  return posts.map(post => {
    const commentCount = Number(post.commentCount || 0)
    const comments = post.comments || []

    // 已经有评论，不重复生成
    if (comments.length > 0) {
      return Object.assign({}, post, {
        commentCount: comments.length,
        comments: comments
      })
    }

    // 没有评论，但 commentCount 大于 0，则生成模拟评论
    if (commentCount > 0) {
      const mockComments = []

      for (let i = 0; i < commentCount; i++) {
        mockComments.push(createMockComment(post.postId, i, post.date))
      }

      return Object.assign({}, post, {
        comments: mockComments,
        commentCount: mockComments.length
      })
    }

    // 本来就没有评论
    return Object.assign({}, post, {
      comments: [],
      commentCount: 0
    })
  })
}

module.exports = {
  fillMockComments
}