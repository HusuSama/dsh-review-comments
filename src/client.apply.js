    /* ===== apply: locale dictionaries, tab type, tab body, stylesheet ===== */

    /** Simplified Chinese runtime dictionary; the key set is shared with FR_EN. */
    const FR_ZH = {
      'type.label': '评论',
      'guide.title': '文件评审',
      'guide.description': '浏览文件，按行评审并发送评论',
      'tree.title': '工作区文件',
      'tree.filter': '搜索文件（递归）',
      'tree.empty': '此目录为空',
      'tree.loading': '加载中…',
      'tree.retry': '重试',
      'tree.truncated': '目录项过多，已截断',
      'tree.noWorkspace': '当前会话没有工作目录',
      'tree.refresh': '刷新',
      'tree.back': '返回文件列表',
      'file.loading': '正在读取文件…',
      'file.error': '无法读取文件',
      'file.notText': '此文件不是文本文件，无法预览',
      'file.truncated': '文件较长，仅显示前 {count} 行',
      'file.linesCount': '{count} 行',
      'file.reload': '重新读取',
      'file.hint': '双击行或拖动框选以添加评论',
      'comment.placeholder': '输入评审评论…',
      'comment.enterHint': 'Enter 添加 · Ctrl+Enter 发送全部 · Esc 取消',
      'comment.add': '添加评论',
      'comment.cancel': '取消',
      'comment.delete': '删除评论',
      'comment.count': '{count} 条评论',
      'comment.none': '还没有评论',
      'comment.line': '第 {line} 行',
      'comment.range': '第 {start}-{end} 行',
      'comment.prev': '上一条评论',
      'comment.next': '下一条评论',
      'comment.position': '{index}/{total}',
      'comment.deleteAll': '删除全部评论',
      'comment.deleteFile': '删除本文件评论',
      'comment.cleared': '已删除 {count} 条评论',
      'send.button': '发送',
      'send.sendAll': '发送全部',
      'send.none': '没有可发送的评论',
      'send.done': '已发送 {count} 条评论',
      'send.copied': '无法写入输入框，评论已复制到剪贴板',
      'send.failed': '发送失败，请重试',
      'send.intro': '我在文件中留了 {count} 条评审评论，请按文件与行号逐条处理。',
      'git.toggle': '仅看变更',
      'git.toggleOn': '查看全部文件',
      'git.count': '{count} 个变更',
      'git.noRepo': '未检测到 git 仓库',
      'git.noChanges': '没有未提交的变更',
      'git.deletedHint': '文件已删除，无法预览',
      'git.loading': '读取 git 状态…',
      'git.added': '新增',
      'git.modified': '修改',
      'git.deleted': '删除',
      'git.renamed': '重命名',
      'git.conflicted': '冲突',
      'git.branch': '分支 {branch}',
      'search.searching': '搜索中…',
      'search.results': '{count} 个结果',
      'search.empty': '没有匹配的文件',
      'search.truncated': '结果过多，已截断',
      'search.scanned': '已扫描 {dirs} 个目录',
      'search.hint': '搜索会跳过 .git、node_modules 等目录',
      'error.generic': '操作失败',
      'error.outside': '路径不在工作区内',
      'error.notFound': '文件不存在',
      'error.notDirectory': '不是目录',
    }

    /** English runtime dictionary; same key set as FR_ZH. */
    const FR_EN = {
      'type.label': 'Review',
      'guide.title': 'File review',
      'guide.description': 'Browse files, comment on lines, and send',
      'tree.title': 'Workspace files',
      'tree.filter': 'Search files (recursive)',
      'tree.empty': 'This folder is empty',
      'tree.loading': 'Loading…',
      'tree.retry': 'Retry',
      'tree.truncated': 'Too many entries; the list was cut',
      'tree.noWorkspace': 'This session has no working directory',
      'tree.refresh': 'Refresh',
      'tree.back': 'Back to files',
      'file.loading': 'Reading the file…',
      'file.error': 'Could not read the file',
      'file.notText': 'Not a text file; it cannot be previewed',
      'file.truncated': 'Large file; showing the first {count} lines',
      'file.linesCount': '{count} lines',
      'file.reload': 'Reload',
      'file.hint': 'Double-click a line or drag over lines to comment',
      'comment.placeholder': 'Write a review comment…',
      'comment.enterHint': 'Enter to add · Ctrl+Enter to send all · Esc to cancel',
      'comment.add': 'Add comment',
      'comment.cancel': 'Cancel',
      'comment.delete': 'Delete comment',
      'comment.count': '{count} comments',
      'comment.none': 'No comments yet',
      'comment.line': 'Line {line}',
      'comment.range': 'Lines {start}-{end}',
      'comment.prev': 'Previous comment',
      'comment.next': 'Next comment',
      'comment.position': '{index}/{total}',
      'comment.deleteAll': 'Delete all comments',
      'comment.deleteFile': 'Delete comments in this file',
      'comment.cleared': 'Deleted {count} comments',
      'send.button': 'Send',
      'send.sendAll': 'Send all',
      'send.none': 'Nothing to send',
      'send.done': 'Sent {count} comments',
      'send.copied': 'Could not write to the composer; comments copied to the clipboard',
      'send.failed': 'Sending failed; please retry',
      'send.intro': 'I left {count} review comments in files. Please address them one by one by file and line.',
      'git.toggle': 'Changed only',
      'git.toggleOn': 'Show all files',
      'git.count': '{count} changes',
      'git.noRepo': 'No git repository detected',
      'git.noChanges': 'No uncommitted changes',
      'git.deletedHint': 'This file was deleted and cannot be previewed',
      'git.loading': 'Reading git status…',
      'git.added': 'Added',
      'git.modified': 'Modified',
      'git.deleted': 'Deleted',
      'git.renamed': 'Renamed',
      'git.conflicted': 'Conflicted',
      'git.branch': 'Branch {branch}',
      'search.searching': 'Searching…',
      'search.results': '{count} results',
      'search.empty': 'No matching files',
      'search.truncated': 'Too many results; showing a subset',
      'search.scanned': 'Scanned {dirs} folders',
      'search.hint': 'Skips .git, node_modules and similar folders',
      'error.generic': 'Something went wrong',
      'error.outside': 'Path outside the workspace',
      'error.notFound': 'File not found',
      'error.notDirectory': 'Not a directory',
    }

    /**
     * Guide-card artwork: a document outline with two text lines and a comment
     * bubble on its lower edge, drawn with the inherited ink colour.
     */
    function frGuideIcon(props) {
      const size = props === undefined || props.size === undefined ? 22 : props.size
      const className = props === undefined ? undefined : props.className
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          className,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M6.5 3.5h7.2L18 7.8v6.9' }),
        h('path', { d: 'M13.7 3.5v4.3H18' }),
        h('path', { d: 'M6.5 3.5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h5.2' }),
        h('path', { d: 'M8.8 9.2h4.6' }),
        h('path', { d: 'M8.8 12.4h3.2' }),
        h('path', {
          d: 'M12.6 18.4h2.9l2.4 2v-2h.9a1.4 1.4 0 0 0 1.4-1.4v-2.4a1.4 1.4 0 0 0-1.4-1.4h-6.2a1.4 1.4 0 0 0-1.4 1.4v2.4a1.4 1.4 0 0 0 1.4 1.4z',
        }),
      )
    }


    /**
     * The tab chip's live title. The tab record captures a title when it opens, so an
     * already-open tab would stay in the previous language after a locale switch; this
     * title registration reads the current locale on every render instead.
     * @param props - framework slot props (locale-bound `t`, optional `useTabInfo`).
     * @returns the localized chip label.
     */
    function frTabTitle(props) {
      const safe = props && typeof props === 'object' ? props : {}
      const useTabInfo = typeof safe.useTabInfo === 'function' ? safe.useTabInfo : null
      const tabInfo = useTabInfo ? useTabInfo() : null
      const tab = tabInfo && tabInfo.tab && typeof tabInfo.tab === 'object' ? tabInfo.tab : null
      let label = ''
      if (typeof safe.t === 'function') {
        try { label = String(safe.t('type.label') || '') } catch (err) { label = '' }
      }
      if (!label && tab && typeof tab.title === 'string') label = tab.title
      if (!label) label = 'Review'
      return h('span', null, label)
    }

    /**
     * The tab type: a page type (no resource patterns) opened by kind, with one
     * guide card as the right sidebar's entry point.
     */
    function frTabDefinition(t) {
      return {
        id: FR_TYPE_ID,
        kind: 'file-review',
        priority: 'extension',
        title: () => t('type.label'),
        guide: [
          {
            id: 'review',
            order: 30,
            title: () => t('guide.title'),
            description: () => t('guide.description'),
            icon: frGuideIcon,
          },
        ],
      }
    }

    /** Required browser services: the right sidebar, its tab registry, and file reads. */
    const inject = [
      'slots',
      'locale',
      'sidebarRightTabs',
      'sidebarRight',
      'remote',
      'remote.workspaceFiles',
    ]

    /**
     * Client plugin body: register copy, the tab type, the tab body, and styles.
     * @param ctx - the Client root context carrying the registry, slots, and Remote face.
     */
    function apply(ctx) {
      const t = ctx.locale.bind(FR_NS)


      ctx.effect(
        () => ctx.locale.register(FR_NS, { zh: FR_ZH, en: FR_EN }),
        'file-review: dictionaries',
      )

      ctx.effect(() => ctx.sidebarRightTabs.register(frTabDefinition(t)), 'file-review: tab type')

      const api = {
        list: (sessionId, absolutePath, signal) =>
          ctx.remote.workspaceFiles.list(sessionId, absolutePath, signal),
        read: (sessionId, path, offset, signal) =>
          ctx.remote.workspaceFiles.read(sessionId, path, { offset, limit: FR_PAGE_LINES }, signal),
      }

      const Body = frCreateBody(api)

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.right.pane.tab', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.pane.tab',
                key: FR_TYPE_ID,
                locale: FR_NS,
              },
              Body,
            ),
          ),
        'file-review: tab body',
      )

      // Invisible bridge above the composer: while review comments are pending, a normal
      // send appends them below the user's text (blank line separated) and submits.
      ctx.effect(
        () =>
          ctx.slots.inject('conversation.input.dock', () =>
            ctx.slots.register(
              {
                name: 'conversation.input.dock',
                id: 'file-review-comment-bridge',
                order: 90,
                locale: FR_NS,
              },
              FrCommentBridge,
            ),
          ),
        'file-review: composer bridge',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.right.pane.tab.title', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.pane.tab.title',
                key: FR_TYPE_ID,
                locale: FR_NS,
              },
              frTabTitle,
            ),
          ),
        'file-review: tab title',
      )

      ctx.effect(() => {
        const tag = document.createElement('style')
        tag.dataset.plugin = FR_TYPE_ID
        tag.textContent = FR_CSS
        document.head.appendChild(tag)
        return () => {
          tag.remove()
        }
      }, 'file-review: stylesheet')
    }

    /**
     * The plugin definition the module loader registers: the Cordis inject list and
     * the apply body. Exported through this constant so the fragment stays a valid
     * standalone script for syntax checking.
     */
    const FR_PLUGIN = { inject, apply }
