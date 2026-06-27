const DEFAULT_ALL_CATEGORY_NAME = "\u5168\u90e8"

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeId(value) {
  if (value === undefined || value === null) {
    return ""
  }

  return String(value).trim()
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return ""
  }

  return String(value).trim()
}

function createIssue(code, message, targetType, targetId, detail) {
  return {
    code: code,
    message: message,
    targetType: targetType,
    targetId: targetId === undefined ? null : targetId,
    detail: detail || {}
  }
}

function addIssue(report, level, code, message, targetType, targetId, detail) {
  report[level].push(createIssue(code, message, targetType, targetId, detail))
}

function addError(report, code, message, targetType, targetId, detail) {
  addIssue(report, "errors", code, message, targetType, targetId, detail)
}

function addWarning(report, code, message, targetType, targetId, detail) {
  addIssue(report, "warnings", code, message, targetType, targetId, detail)
}

function addInfo(report, code, message, targetType, targetId, detail) {
  addIssue(report, "infos", code, message, targetType, targetId, detail)
}

function getCategoryName(category) {
  if (category && typeof category === "object") {
    return normalizeText(category.name)
  }

  return normalizeText(category)
}

function buildIndex(report, items, idField, targetType, duplicateCode, missingCode) {
  const index = new Map()

  items.forEach((item, itemIndex) => {
    const rawId = item && item[idField]
    const id = normalizeId(rawId)

    if (!id) {
      addError(
        report,
        missingCode,
        targetType + " is missing " + idField + ".",
        targetType,
        null,
        { index: itemIndex, idField: idField }
      )
      return
    }

    if (index.has(id)) {
      addError(
        report,
        duplicateCode,
        targetType + " " + id + " appears more than once.",
        targetType,
        id,
        { firstIndex: index.get(id).index, duplicateIndex: itemIndex, idField: idField }
      )
      return
    }

    index.set(id, {
      item: item,
      index: itemIndex
    })
  })

  return index
}

function hasIndexId(index, id) {
  return Boolean(id && index.has(id))
}

function getIndexItem(index, id) {
  const entry = id ? index.get(id) : null

  return entry ? entry.item : null
}

function isActiveComment(comment) {
  return !comment || !comment.status || comment.status === "active"
}

function getNumber(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

function collectCategoryInfo(categories, options) {
  const allCategoryNames = new Set([normalizeText(options.allCategoryName || DEFAULT_ALL_CATEGORY_NAME)])
  const categoryNames = new Set()

  categories.forEach(category => {
    const name = getCategoryName(category)

    if (!name) {
      return
    }

    categoryNames.add(name)

    if (category && typeof category === "object" && Number(category.id) === 0) {
      allCategoryNames.add(name)
    }
  })

  return {
    categoryNames: categoryNames,
    allCategoryNames: allCategoryNames
  }
}

function validateCurrentUser(report, currentUser, userIndex) {
  const currentUserId = normalizeId(currentUser && currentUser.userId)

  if (!currentUserId) {
    addError(
      report,
      "CURRENT_USER_MISSING",
      "currentUser.userId is required.",
      "currentUser",
      null,
      {}
    )
    return ""
  }

  if (!hasIndexId(userIndex, currentUserId)) {
    addError(
      report,
      "CURRENT_USER_NOT_FOUND",
      "currentUser.userId does not exist in users.",
      "currentUser",
      currentUserId,
      { userId: currentUserId }
    )
  }

  return currentUserId
}

function validatePostAuthors(report, posts, userIndex) {
  posts.forEach(post => {
    const postId = normalizeId(post && post.postId)
    const authorId = normalizeId(post && post.authorId)

    if (!authorId) {
      if (normalizeText(post && post.author) || normalizeText(post && post.avatar)) {
        addWarning(
          report,
          "POST_AUTHOR_COMPAT_FIELDS",
          "Post still relies on author/avatar compatibility fields without authorId.",
          "post",
          postId || null,
          {
            postId: postId,
            author: post && post.author,
            avatar: post && post.avatar
          }
        )
        return
      }

      addError(
        report,
        "POST_AUTHOR_ID_MISSING",
        "Post authorId is required for user reference validation.",
        "post",
        postId || null,
        { postId: postId }
      )
      return
    }

    if (!hasIndexId(userIndex, authorId)) {
      addError(
        report,
        "POST_AUTHOR_NOT_FOUND",
        "Post authorId does not exist in users.",
        "post",
        postId || null,
        { postId: postId, authorId: authorId }
      )
    }
  })
}

function validateCategories(report, posts, categories, options) {
  const categoryInfo = collectCategoryInfo(categories, options)
  const hasCategories = categoryInfo.categoryNames.size > 0

  categoryInfo.allCategoryNames.forEach(name => {
    if (name && categoryInfo.categoryNames.has(name)) {
      addInfo(
        report,
        "CATEGORY_ALL_FILTER_COMPAT",
        "Category list contains the all-filter compatibility item.",
        "category",
        name,
        { categoryName: name }
      )
    }
  })

  if (!hasCategories) {
    addWarning(
      report,
      "CATEGORY_LIST_EMPTY",
      "No category list was provided, so post category references cannot be fully checked.",
      "category",
      null,
      {}
    )
  }

  posts.forEach(post => {
    const postId = normalizeId(post && post.postId)
    const category = normalizeText(post && post.category)

    if (categoryInfo.allCategoryNames.has(category)) {
      addError(
        report,
        "POST_CATEGORY_ALL_INVALID",
        "The all-filter category must not be used as a real post category.",
        "post",
        postId || null,
        { postId: postId, category: category }
      )
      return
    }

    if (hasCategories && !categoryInfo.categoryNames.has(category)) {
      addError(
        report,
        "POST_CATEGORY_NOT_FOUND",
        "Post category does not exist in the category list.",
        "post",
        postId || null,
        { postId: postId, category: category }
      )
    }
  })
}

function validateComments(report, comments, postIndex, userIndex, commentIndex) {
  comments.forEach(comment => {
    const commentId = normalizeId(comment && comment.commentId)
    const postId = normalizeId(comment && comment.postId)
    const authorId = normalizeId(comment && comment.authorId)
    const parentCommentId = normalizeId(comment && comment.parentCommentId)
    const rootCommentId = normalizeId(comment && comment.rootCommentId)

    if (!hasIndexId(postIndex, postId)) {
      addError(
        report,
        "COMMENT_POST_NOT_FOUND",
        "Comment postId does not exist in posts.",
        "comment",
        commentId || null,
        { commentId: commentId, postId: postId }
      )
    }

    if (!authorId || !hasIndexId(userIndex, authorId)) {
      addError(
        report,
        "COMMENT_AUTHOR_NOT_FOUND",
        "Comment authorId does not exist in users.",
        "comment",
        commentId || null,
        { commentId: commentId, authorId: authorId }
      )
    }

    if (Number(comment && comment.level) === 1 && !rootCommentId) {
      addWarning(
        report,
        "LEVEL_ONE_COMMENT_ROOT_MISSING",
        "Level-one comment still uses a null rootCommentId compatibility shape.",
        "comment",
        commentId || null,
        { commentId: commentId }
      )
    }

    if (parentCommentId && !hasIndexId(commentIndex, parentCommentId)) {
      addError(
        report,
        "COMMENT_PARENT_NOT_FOUND",
        "Comment parentCommentId does not exist in comments.",
        "comment",
        commentId || null,
        { commentId: commentId, parentCommentId: parentCommentId }
      )
    }

    if (rootCommentId && !hasIndexId(commentIndex, rootCommentId)) {
      addError(
        report,
        "COMMENT_ROOT_NOT_FOUND",
        "Comment rootCommentId does not exist in comments.",
        "comment",
        commentId || null,
        { commentId: commentId, rootCommentId: rootCommentId }
      )
    }

    if (parentCommentId && hasIndexId(commentIndex, parentCommentId)) {
      const parentComment = getIndexItem(commentIndex, parentCommentId)
      const parentPostId = normalizeId(parentComment && parentComment.postId)

      if (postId && parentPostId && postId !== parentPostId) {
        addError(
          report,
          "COMMENT_PARENT_POST_MISMATCH",
          "Reply comment postId does not match its parent comment postId.",
          "comment",
          commentId || null,
          { commentId: commentId, postId: postId, parentCommentId: parentCommentId, parentPostId: parentPostId }
        )
      }
    }
  })
}

function validateCommentCounts(report, posts, comments) {
  const activeCountByPostId = new Map()
  let warningCount = 0

  comments.forEach(comment => {
    if (!isActiveComment(comment)) {
      return
    }

    const postId = normalizeId(comment && comment.postId)

    if (!postId) {
      return
    }

    activeCountByPostId.set(postId, (activeCountByPostId.get(postId) || 0) + 1)
  })

  posts.forEach(post => {
    const postId = normalizeId(post && post.postId)
    const expected = getNumber(post && post.commentCount)
    const actual = activeCountByPostId.get(postId) || 0

    if (expected === null) {
      warningCount += 1
      addWarning(
        report,
        "POST_COMMENT_COUNT_INVALID",
        "Post commentCount is not a finite number.",
        "post",
        postId || null,
        { postId: postId, commentCount: post && post.commentCount, activeCommentCount: actual }
      )
      return
    }

    if (expected !== actual) {
      warningCount += 1
      addWarning(
        report,
        "POST_COMMENT_COUNT_MISMATCH",
        "Post commentCount does not match active comments.",
        "post",
        postId || null,
        { postId: postId, commentCount: expected, activeCommentCount: actual }
      )
    }
  })

  return warningCount
}

function validateMyPostIds(report, myPostIds, postIndex, currentUserId) {
  myPostIds.forEach(postIdValue => {
    const postId = normalizeId(postIdValue)
    const post = getIndexItem(postIndex, postId)

    if (!post) {
      addWarning(
        report,
        "MY_POST_NOT_FOUND",
        "myPostIds contains an id that does not exist in posts.",
        "myPost",
        postId || null,
        { postId: postId }
      )
      return
    }

    const authorId = normalizeId(post.authorId)

    if (currentUserId && authorId && authorId !== currentUserId) {
      addWarning(
        report,
        "MY_POST_AUTHOR_MISMATCH",
        "myPostIds contains a post that is not authored by the current user.",
        "myPost",
        postId,
        { postId: postId, authorId: authorId, currentUserId: currentUserId }
      )
    }
  })
}

function validateCovers(report, posts) {
  let postsWithCover = 0
  let postsWithoutCover = 0

  posts.forEach(post => {
    const postId = normalizeId(post && post.postId)
    const postImg = post && post.postImg

    if (postImg !== undefined && postImg !== null && postImg !== "" && typeof postImg !== "string") {
      addWarning(
        report,
        "POST_IMG_NOT_STRING",
        "postImg exists but is not a string.",
        "post",
        postId || null,
        { postId: postId, postImgType: typeof postImg }
      )
    }

    if (typeof postImg === "string" && postImg.trim()) {
      postsWithCover += 1
    } else {
      postsWithoutCover += 1
    }
  })

  return {
    postsWithCover: postsWithCover,
    postsWithoutCover: postsWithoutCover
  }
}

function addSummaryInfos(report, posts, comments, users, currentUserId, coverSummary, commentCountWarningCount) {
  addInfo(report, "SUMMARY_POST_COUNT", "Total post count.", "summary", "posts", { count: posts.length })
  addInfo(report, "SUMMARY_COMMENT_COUNT", "Total comment count.", "summary", "comments", { count: comments.length })
  addInfo(report, "SUMMARY_USER_COUNT", "Total user count.", "summary", "users", { count: users.length })
  addInfo(
    report,
    "SUMMARY_CURRENT_USER_ID",
    "Current user id.",
    "summary",
    "currentUser",
    { currentUserId: currentUserId || "" }
  )
  addInfo(
    report,
    "SUMMARY_POSTS_WITH_COVER",
    "Posts with cover count.",
    "summary",
    "postsWithCover",
    { count: coverSummary.postsWithCover }
  )
  addInfo(
    report,
    "SUMMARY_POSTS_WITHOUT_COVER",
    "Posts without cover count.",
    "summary",
    "postsWithoutCover",
    { count: coverSummary.postsWithoutCover }
  )
  addInfo(
    report,
    "SUMMARY_COMMENT_COUNT_WARNING_COUNT",
    "Posts with commentCount warnings.",
    "summary",
    "commentCountWarnings",
    { count: commentCountWarningCount }
  )
}

function validateForumData(snapshot, options) {
  const safeSnapshot = snapshot || {}
  const safeOptions = options || {}
  const report = {
    errors: [],
    warnings: [],
    infos: []
  }
  const posts = asArray(safeSnapshot.posts)
  const comments = asArray(safeSnapshot.comments)
  const users = asArray(safeSnapshot.users)
  const categories = asArray(safeSnapshot.categories || safeSnapshot.categoryList)
  const myPostIds = asArray(safeSnapshot.myPostIds)

  const postIndex = buildIndex(report, posts, "postId", "post", "DUPLICATE_POST_ID", "POST_ID_MISSING")
  const commentIndex = buildIndex(
    report,
    comments,
    "commentId",
    "comment",
    "DUPLICATE_COMMENT_ID",
    "COMMENT_ID_MISSING"
  )
  const userIndex = buildIndex(report, users, "userId", "user", "DUPLICATE_USER_ID", "USER_ID_MISSING")
  const currentUserId = validateCurrentUser(report, safeSnapshot.currentUser, userIndex)

  validatePostAuthors(report, posts, userIndex)
  validateComments(report, comments, postIndex, userIndex, commentIndex)
  validateCategories(report, posts, categories, safeOptions)
  validateMyPostIds(report, myPostIds, postIndex, currentUserId)

  const commentCountWarningCount = validateCommentCounts(report, posts, comments)
  const coverSummary = validateCovers(report, posts)

  addSummaryInfos(report, posts, comments, users, currentUserId, coverSummary, commentCountWarningCount)

  return report
}

module.exports = {
  validateForumData
}
