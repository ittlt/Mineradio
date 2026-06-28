// ====================================================================
//  汽水音乐 HTTP API 端点集合
//  集成到 server.js 中的路由
// ====================================================================

const {
  sendLoginCode,
  loginWithCode,
  refreshQishuiToken,
  getQishuiUserInfo,
  getQishuiLoginStatus,
  logoutQishui,
  searchQishuiSongs,
  getQishuiUserPlaylists,
  getQishuiPlaylistTracks,
  createQishuiPlaylist,
  addTracksToQishuiPlaylist,
  removeTracksFromQishuiPlaylist,
  getQishuiPersonalizedRecommend,
  getQishuiNewSongsRecommend,
} = require('./qishui-music-api');

function setupQishuiEndpoints(server) {
  // 注意: 这些端点应该在 server.js 的主请求处理函数中集成
  // 下面提供的是端点处理的核心逻辑，需要添加到你的 HTTP 处理中
  
  return {
    // ========== 登录相关 ==========
    
    /**
     * POST /api/qishui/login/send-code
     * 发送登录验证码
     */
    async handleSendCode(req, res, url, readRequestBody) {
      try {
        const body = await readRequestBody(req);
        const mobile = body.mobile || url.searchParams.get('mobile') || '';
        
        if (!mobile) {
          this.sendJSON(res, { error: 'MISSING_MOBILE', message: '请输入手机号' }, 400);
          return;
        }

        const result = await sendLoginCode(mobile);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiLogin]', err);
        this.sendJSON(res, { error: err.message, message: '发送验证码失败' }, 500);
      }
    },

    /**
     * POST /api/qishui/login/verify-code
     * 验证码登录
     */
    async handleVerifyCode(req, res, url, readRequestBody) {
      try {
        const body = await readRequestBody(req);
        const mobile = body.mobile || url.searchParams.get('mobile') || '';
        const code = body.code || url.searchParams.get('code') || '';

        if (!mobile || !code) {
          this.sendJSON(res, { error: 'MISSING_PARAMETERS', message: '手机号和验证码不能为空' }, 400);
          return;
        }

        const result = await loginWithCode(mobile, code);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiVerifyCode]', err);
        this.sendJSON(res, { error: err.message, message: '登录失败' }, 500);
      }
    },

    /**
     * GET /api/qishui/login/status
     * 获取登录状态
     */
    async handleLoginStatus(req, res) {
      try {
        const status = getQishuiLoginStatus();
        this.sendJSON(res, status);
      } catch (err) {
        console.error('[QishuiLoginStatus]', err);
        this.sendJSON(res, { provider: 'qishui', loggedIn: false, error: err.message }, 500);
      }
    },

    /**
     * POST /api/qishui/logout
     * 登出
     */
    async handleLogout(req, res) {
      try {
        const result = logoutQishui();
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiLogout]', err);
        this.sendJSON(res, { error: err.message }, 500);
      }
    },

    // ========== 搜索相关 ==========

    /**
     * GET /api/qishui/search
     * 搜索歌曲
     */
    async handleSearch(req, res, url) {
      try {
        const keywords = url.searchParams.get('keywords') || url.searchParams.get('q') || '';
        const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20', 10) || 20));

        if (!keywords) {
          this.sendJSON(res, { provider: 'qishui', songs: [] });
          return;
        }

        const songs = await searchQishuiSongs(keywords, limit);
        this.sendJSON(res, { provider: 'qishui', keywords, songs });
      } catch (err) {
        console.error('[QishuiSearch]', err);
        this.sendJSON(res, { provider: 'qishui', error: err.message, songs: [] }, 500);
      }
    },

    // ========== 歌单相关 ==========

    /**
     * GET /api/qishui/playlists
     * 获取用户歌单
     */
    async handleGetPlaylists(req, res, url) {
      try {
        const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;
        const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '30', 10) || 30));

        const result = await getQishuiUserPlaylists(offset, limit);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiGetPlaylists]', err);
        this.sendJSON(res, { provider: 'qishui', loggedIn: false, error: err.message, playlists: [] }, 500);
      }
    },

    /**
     * GET /api/qishui/playlist/tracks
     * 获取歌单中的歌曲
     */
    async handleGetPlaylistTracks(req, res, url) {
      try {
        const playlistId = url.searchParams.get('id') || url.searchParams.get('playlist_id') || '';
        const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;
        const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10) || 50));

        if (!playlistId) {
          this.sendJSON(res, { error: 'MISSING_PLAYLIST_ID', message: '歌单ID不能为空' }, 400);
          return;
        }

        const result = await getQishuiPlaylistTracks(playlistId, offset, limit);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiGetPlaylistTracks]', err);
        this.sendJSON(res, { provider: 'qishui', error: err.message, tracks: [] }, 500);
      }
    },

    /**
     * POST /api/qishui/playlist/create
     * 创建歌单
     */
    async handleCreatePlaylist(req, res, url, readRequestBody) {
      try {
        const body = await readRequestBody(req);
        const name = body.name || url.searchParams.get('name') || '';
        const description = body.description || url.searchParams.get('description') || '';
        const privacy = body.privacy != null ? !!body.privacy : false;

        if (!name) {
          this.sendJSON(res, { error: 'MISSING_NAME', message: '歌单名称不能为空' }, 400);
          return;
        }

        const result = await createQishuiPlaylist(name, description, privacy);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiCreatePlaylist]', err);
        this.sendJSON(res, { error: err.message, message: '创建歌单失败' }, 500);
      }
    },

    /**
     * POST /api/qishui/playlist/add-songs
     * 添加歌曲到歌单
     */
    async handleAddSongs(req, res, url, readRequestBody) {
      try {
        const body = await readRequestBody(req);
        const playlistId = body.playlist_id || url.searchParams.get('playlist_id') || '';
        let musicIds = body.music_ids || body.ids || [];

        if (typeof musicIds === 'string') {
          musicIds = musicIds.split(',').map(s => s.trim()).filter(Boolean);
        }

        if (!playlistId || !musicIds.length) {
          this.sendJSON(res, { error: 'MISSING_PARAMETERS', message: '歌单ID和歌曲ID不能为空' }, 400);
          return;
        }

        const result = await addTracksToQishuiPlaylist(playlistId, musicIds);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiAddSongs]', err);
        this.sendJSON(res, { error: err.message, message: '添加歌曲失败' }, 500);
      }
    },

    /**
     * POST /api/qishui/playlist/remove-songs
     * 从歌单删除歌曲
     */
    async handleRemoveSongs(req, res, url, readRequestBody) {
      try {
        const body = await readRequestBody(req);
        const playlistId = body.playlist_id || url.searchParams.get('playlist_id') || '';
        let musicIds = body.music_ids || body.ids || [];

        if (typeof musicIds === 'string') {
          musicIds = musicIds.split(',').map(s => s.trim()).filter(Boolean);
        }

        if (!playlistId || !musicIds.length) {
          this.sendJSON(res, { error: 'MISSING_PARAMETERS', message: '歌单ID和歌曲ID不能为空' }, 400);
          return;
        }

        const result = await removeTracksFromQishuiPlaylist(playlistId, musicIds);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiRemoveSongs]', err);
        this.sendJSON(res, { error: err.message, message: '删除歌曲失败' }, 500);
      }
    },

    // ========== 推荐相关 ==========

    /**
     * GET /api/qishui/recommend/personalized
     * 获取个性化推荐
     */
    async handlePersonalizedRecommend(req, res, url) {
      try {
        const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
        const result = await getQishuiPersonalizedRecommend(limit);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiPersonalizedRecommend]', err);
        this.sendJSON(res, { provider: 'qishui', loggedIn: false, error: err.message, songs: [] }, 500);
      }
    },

    /**
     * GET /api/qishui/recommend/new
     * 获取新歌推荐
     */
    async handleNewSongsRecommend(req, res, url) {
      try {
        const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
        const result = await getQishuiNewSongsRecommend(limit);
        this.sendJSON(res, result);
      } catch (err) {
        console.error('[QishuiNewSongsRecommend]', err);
        this.sendJSON(res, { provider: 'qishui', error: err.message, songs: [] }, 500);
      }
    },

    // 辅助方法
    sendJSON(res, data, status) {
      res.writeHead(status || 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(data));
    },
  };
}

module.exports = { setupQishuiEndpoints };
