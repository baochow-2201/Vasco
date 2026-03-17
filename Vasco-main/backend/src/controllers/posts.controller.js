const { Post, User, Media, Comment, PostMedia, UserProfile, Reaction } = require("../models");
const response = require("../utils/response");
const { uploadToCloudinary } = require("../utils/cloudinary");

module.exports = {
  create: async (req, res) => {
    try {
      const userId = req.userId || (req.user && req.user.id);
      if (!userId) return response.error(res, "Unauthorized", 401);

      const { text, content } = req.body;
      
      // Check if text/content is provided
      if (!text && !content && (!req.files || req.files.length === 0)) {
        return response.error(res, "Post content or media is required", 400);
      }

      const post = await Post.create({ 
        user_id: userId, 
        content: text || content,
        created_at: new Date(),
      });

      // If files are uploaded via multer (media field in FormData), upload to Cloudinary or local
      if (req.files && req.files.length > 0) {
        let idx = 0;
        for (const f of req.files) {
          try {
            // Try upload to Cloudinary if configured
            if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here') {
              if (process.env.DEBUG === 'true') console.log('Uploading file to Cloudinary:', f.filename);
              const cloudinaryResult = await uploadToCloudinary(f.path, 'vasco/posts');
              
              const media = await Media.create({ 
                public_id: cloudinaryResult.public_id, 
                url: cloudinaryResult.url, 
                type: cloudinaryResult.type, 
                format: cloudinaryResult.format 
              });
              await PostMedia.create({ post_id: post.id, media_id: media.id, order_index: idx++ });
              if (process.env.DEBUG === 'true') console.log('Media created from Cloudinary:', media.id);
            } else {
              // Fallback to local storage
              if (process.env.DEBUG === 'true') console.log('Cloudinary not configured, using local storage');
              const url = `/uploads/${f.filename}`;
              const media = await Media.create({ 
                public_id: f.filename, 
                url, 
                type: f.mimetype.startsWith('image') ? 'image' : 'video', 
                format: f.mimetype.split('/')[1] 
              });
              await PostMedia.create({ post_id: post.id, media_id: media.id, order_index: idx++ });
              if (process.env.DEBUG === 'true') console.log('Media created from local storage:', media.id);
            }
          } catch (err) {
            console.error('Error uploading file:', err.message);
            // Continue with next file if one fails
          }
        }
      }

      const createdPost = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'full_name'],
            include: [
              {
                model: UserProfile,
                as: 'user_profile',
                attributes: ['full_name', 'avatar_url', 'bio']
              }
            ]
          },
          {
            model: PostMedia,
            include: [
              {
                model: Media,
                as: 'media'
              }
            ]
          },
          {
            model: Comment,
            attributes: ['id', 'content', 'created_at', 'user_id'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'full_name'],
                include: [
                  {
                    model: UserProfile,
                    as: 'user_profile',
                    attributes: ['full_name', 'avatar_url']
                  }
                ]
              }
            ]
          }
        ] 
      });

      // Emit new_post via socket if available and realtime enabled
      try {
        const io = req.app.get('io');
        const realtimeEnabled = req.app.get('realtimeEnabled') !== false;
        if (io && realtimeEnabled) io.emit('new_post', { post: createdPost });
      } catch (e) { 
        console.error('Socket emit error:', e);
      }

      return response.success(res, "Post created", { post: createdPost });
    } catch (err) {
      console.error('Error creating post:', err.message);
      return response.error(res, err.message, 500);
    }
  },

  getAll: async (req, res) => {
    try {
      const { user_id } = req.query;
      const where = { is_hidden: false };
      
      // Filter by user_id if provided
      if (user_id) {
        where.user_id = user_id;
      }
      
      const posts = await Post.findAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'full_name'],
            include: [
              {
                model: UserProfile,
                as: 'user_profile',
                attributes: ['full_name', 'avatar_url', 'bio']
              }
            ]
          },
          {
            model: PostMedia,
            include: [
              {
                model: Media,
                as: 'media'
              }
            ]
          },
          {
            model: Comment,
            where: { is_hidden: false },
            required: false,
            attributes: ['id', 'content', 'created_at', 'user_id'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'full_name'],
                include: [
                  {
                    model: UserProfile,
                    as: 'user_profile',
                    attributes: ['full_name', 'avatar_url']
                  }
                ]
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
      });
      if (process.env.DEBUG === 'true') {
        console.log('DEBUG [getAll] posts length:', posts.length);
        if (posts.length > 0) {
          console.log('DEBUG [getAll] first post.user:', posts[0].user?.id);
          console.log('DEBUG [getAll] first post.user?.user_profile:', !!posts[0].user?.user_profile);
        }
      }
      return response.success(res, "Posts fetched", { posts });
    } catch (err) {
      console.error('Error fetching posts:', err);
      return response.error(res, err.message);
    }
  },

  getById: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'full_name'],
            include: [
              {
                model: UserProfile,
                as: 'user_profile',
                attributes: ['full_name', 'avatar_url', 'bio']
              }
            ]
          },
          {
            model: PostMedia,
            include: [
              {
                model: Media,
                as: 'media'
              }
            ]
          },
          {
            model: Comment,
            attributes: ['id', 'content', 'created_at', 'user_id'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'full_name'],
                include: [
                  {
                    model: UserProfile,
                    as: 'user_profile',
                    attributes: ['full_name', 'avatar_url']
                  }
                ]
              }
            ]
          }
        ],
      });
      if (!post) return response.error(res, "Post not found", 404);

      return response.success(res, "Post fetched", { post });
    } catch (err) {
      console.error('Error fetching post:', err);
      return response.error(res, err.message);
    }
  },

  update: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.id);
      if (!post) return response.error(res, "Post not found", 404);

      // Check ownership
      if (post.user_id !== req.userId) {
        return response.error(res, "Forbidden: not your post", 403);
      }

      await post.update(req.body);
      const updated = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'full_name'],
            include: [
              {
                model: UserProfile,
                as: 'user_profile',
                attributes: ['full_name', 'avatar_url', 'bio']
              }
            ]
          },
          {
            model: PostMedia,
            include: [
              {
                model: Media,
                as: 'media'
              }
            ]
          },
          {
            model: Comment,
            attributes: ['id', 'content', 'created_at', 'user_id'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'full_name'],
                include: [
                  {
                    model: UserProfile,
                    as: 'user_profile',
                    attributes: ['full_name', 'avatar_url']
                  }
                ]
              }
            ]
          }
        ],
      });

      return response.success(res, "Post updated", { post: updated });
    } catch (err) {
      console.error('Error updating post:', err);
      return response.error(res, err.message);
    }
  },

  delete: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.id);
      if (!post) return response.error(res, "Post not found", 404);

      // Check ownership
      if (post.user_id !== req.userId) {
        return response.error(res, "Forbidden: not your post", 403);
      }

      await post.destroy();
      return response.success(res, "Post deleted");
    } catch (err) {
      console.error('Error deleting post:', err);
      return response.error(res, err.message);
    }
  },

  hidePost: async (req, res) => {
    try {
      const post = await Post.findByPk(req.params.id);
      if (!post) return response.error(res, "Post not found", 404);

      await post.update({ is_hidden: true });
      return response.success(res, "Post hidden", { post });
    } catch (err) {
      console.error('Error hiding post:', err);
      return response.error(res, err.message);
    }
  },

  likePost: async (req, res) => {
    try {
      const userId = req.userId || (req.user && req.user.id);
      if (!userId) return response.error(res, "Unauthorized", 401);

      const postId = req.params.id;
      const post = await Post.findByPk(postId);
      if (!post) return response.error(res, "Post not found", 404);

      // Check if user already liked this post
      const existingReaction = await Reaction.findOne({
        where: { user_id: userId, post_id: postId }
      });

      if (existingReaction) {
        // Unlike: remove the reaction
        await existingReaction.destroy();
        console.log(`❌ User ${userId} unliked post ${postId}`);
        return response.success(res, "Post unliked", { liked: false });
      } else {
        // Like: create new reaction
        const reaction = await Reaction.create({
          user_id: userId,
          post_id: postId,
          type: 'like'
        });
        console.log(`❤️ User ${userId} liked post ${postId}`);
        return response.success(res, "Post liked", { liked: true, reaction });
      }
    } catch (err) {
      console.error('Error liking post:', err);
      return response.error(res, err.message);
    }
  },
};
