// src/models/index.js
const sequelize = require("../config/database");

// Import tất cả model
const User = require("./users.model");
const UserProfile = require("./user_profiles.model");
const FriendRequest = require("./friend_requests.model");
const Friendship = require("./friendships.model");
const Post = require("./posts.model");
const Comment = require("./comments.model");
const Reaction = require("./reactions.model");
const Report = require("./reports.model");
const Media = require("./media.model");
const PostMedia = require("./post_media.model");
const Conversation = require("./conversations.model");
const ConversationParticipant = require("./conversation_participants.model");
const Message = require("./messages.model");
const MessageMedia = require("./message_media.model");
const Notification = require("./notifications.model");
const AuditLog = require("./audit_logs.model");

/* -------------------------------------------------------------
   1. USERS ↔ USER PROFILES (1 - 1)
--------------------------------------------------------------*/
User.hasOne(UserProfile, {
  foreignKey: "user_id",
  as: "user_profile",
  onDelete: "CASCADE",
});
UserProfile.belongsTo(User, {
  foreignKey: "user_id",
});

/* -------------------------------------------------------------
   2. FRIEND REQUESTS (user → user)
--------------------------------------------------------------*/
User.hasMany(FriendRequest, {
  as: "sent_requests",
  foreignKey: "requester_id",
});
User.hasMany(FriendRequest, {
  as: "received_requests",
  foreignKey: "receiver_id",
});
FriendRequest.belongsTo(User, { as: "requester", foreignKey: "requester_id" });
FriendRequest.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });

/* -------------------------------------------------------------
   3. FRIENDSHIPS (n-n nhưng lưu bằng 1 bảng)
--------------------------------------------------------------*/
User.hasMany(Friendship, { as: "friend1", foreignKey: "user1_id" });
User.hasMany(Friendship, { as: "friend2", foreignKey: "user2_id" });

Friendship.belongsTo(User, { as: "user1", foreignKey: "user1_id" });
Friendship.belongsTo(User, { as: "user2", foreignKey: "user2_id" });

/* -------------------------------------------------------------
   4. POSTS (1 user - n posts)
--------------------------------------------------------------*/
User.hasMany(Post, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});
Post.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

/* -------------------------------------------------------------
   5. COMMENTS (user → post)
--------------------------------------------------------------*/
Post.hasMany(Comment, {
  foreignKey: "post_id",
  onDelete: "CASCADE",
});
Comment.belongsTo(Post, {
  foreignKey: "post_id",
});

User.hasMany(Comment, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});
Comment.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

/* -------------------------------------------------------------
   6. REACTIONS (cho post & comment)
--------------------------------------------------------------*/
User.hasMany(Reaction, { foreignKey: "user_id" });
Reaction.belongsTo(User, { foreignKey: "user_id" });

Post.hasMany(Reaction, { foreignKey: "post_id" });
Reaction.belongsTo(Post, { foreignKey: "post_id" });

Comment.hasMany(Reaction, { foreignKey: "comment_id" });
Reaction.belongsTo(Comment, { foreignKey: "comment_id" });

/* -------------------------------------------------------------
   7. REPORTS (user → user/post/comment)
--------------------------------------------------------------*/
User.hasMany(Report, { as: "reports_sent", foreignKey: "reporter_id" });
Report.belongsTo(User, { as: "reporter", foreignKey: "reporter_id" });

User.hasMany(Report, { as: "reported_users", foreignKey: "reported_user_id" });
Report.belongsTo(User, { as: "reported_user", foreignKey: "reported_user_id" });

Post.hasMany(Report, { foreignKey: "post_id" });
Report.belongsTo(Post, { foreignKey: "post_id" });

Comment.hasMany(Report, { foreignKey: "comment_id" });
Report.belongsTo(Comment, { foreignKey: "comment_id" });

/* -------------------------------------------------------------
   8. MEDIA (post → media)
--------------------------------------------------------------*/
Post.hasMany(Media, {
  foreignKey: "post_id",
  onDelete: "CASCADE",
});
Media.belongsTo(Post, {
  foreignKey: "post_id",
});

/* -------------------------------------------------------------
   9. POST_MEDIA (n-n)
--------------------------------------------------------------*/
PostMedia.belongsTo(Post, { foreignKey: "post_id" });
PostMedia.belongsTo(Media, { foreignKey: "media_id", as: "media" });

Post.hasMany(PostMedia, { foreignKey: "post_id" });
Media.hasMany(PostMedia, { foreignKey: "media_id" });

/* -------------------------------------------------------------
   10. CONVERSATIONS (group or private)
--------------------------------------------------------------*/
Conversation.belongsToMany(User, {
  through: ConversationParticipant,
  foreignKey: "conversation_id",
  otherKey: "user_id",
});

User.belongsToMany(Conversation, {
  through: ConversationParticipant,
  foreignKey: "user_id",
  otherKey: "conversation_id",
});

// Direct relationship for easier querying
Conversation.hasMany(ConversationParticipant, {
  foreignKey: "conversation_id",
  as: "conversation_participants",
});

ConversationParticipant.belongsTo(Conversation, {
  foreignKey: "conversation_id",
});

ConversationParticipant.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

/* -------------------------------------------------------------
   11. MESSAGES (conversation → messages)
--------------------------------------------------------------*/
Conversation.hasMany(Message, {
  foreignKey: "conversation_id",
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, {
  foreignKey: "conversation_id",
});

// Sender
User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { as: "sender", foreignKey: "sender_id" });

// Receiver (optional for private chat)
User.hasMany(Message, { foreignKey: "receiver_id" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiver_id" });

/* -------------------------------------------------------------
   12. MESSAGE_MEDIA (media → messages)
--------------------------------------------------------------*/
MessageMedia.belongsTo(Message, { foreignKey: "message_id" });
MessageMedia.belongsTo(Media, { foreignKey: "media_id" });

Message.hasMany(MessageMedia, { foreignKey: "message_id" });
Media.hasMany(MessageMedia, { foreignKey: "media_id" });

/* -------------------------------------------------------------
   13. NOTIFICATIONS
--------------------------------------------------------------*/
Notification.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Notification, { foreignKey: "user_id" });

/* -------------------------------------------------------------
   14. AUDIT_LOGS (admin logs)
--------------------------------------------------------------*/
AuditLog.belongsTo(User, {
  as: "admin",
  foreignKey: "admin_id",
});
User.hasMany(AuditLog, {
  as: "admin_logs",
  foreignKey: "admin_id",
});

/* -------------------------------------------------------------
   EXPORT TẤT CẢ MODEL
--------------------------------------------------------------*/
module.exports = {
  sequelize,
  User,
  UserProfile,
  FriendRequest,
  Friendship,
  Post,
  Comment,
  Reaction,
  Report,
  Media,
  PostMedia,
  Conversation,
  ConversationParticipant,
  Message,
  MessageMedia,
  Notification,
  AuditLog,
};
