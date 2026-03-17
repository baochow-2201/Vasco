const { FriendRequest, User, UserProfile, Friendship } = require("../models");

module.exports = {
  create: async (req, res) => {
    try {
      const { receiver_id, message } = req.body;
      const requester_id = req.user?.id;

      if (!requester_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!receiver_id) {
        return res.status(400).json({ error: 'receiver_id is required' });
      }

      // Prevent self friend requests
      if (requester_id === receiver_id) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
      }

      const fr = await FriendRequest.create({
        requester_id,
        receiver_id,
        message
      });
      res.json(fr);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Only fetch friend requests where current user is the receiver
      const data = await FriendRequest.findAll({
        where: { receiver_id: currentUserId, status: 'pending' },
        include: [
          { model: User, as: "requester", include: [{ model: UserProfile, as: 'user_profile' }] },
          { model: User, as: "receiver", include: [{ model: UserProfile, as: 'user_profile' }] },
        ],
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const fr = await FriendRequest.findByPk(req.params.id);
      if (!fr) return res.status(404).json({ message: "Not found" });

      await fr.update(req.body);
      res.json({ message: "Updated", fr });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const fr = await FriendRequest.findByPk(req.params.id);
      if (!fr) return res.status(404).json({ message: "Not found" });
      await fr.destroy();
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  accept: async (req, res) => {
    try {
      const fr = await FriendRequest.findByPk(req.params.id);
      if (!fr) return res.status(404).json({ message: "Friend request not found" });

      // Only the receiver can accept
      if (fr.receiver_id !== req.user?.id) {
        return res.status(403).json({ error: 'Only receiver can accept friend request' });
      }

      // Create friendship
      const friendship = await Friendship.create({
        user1_id: fr.requester_id,
        user2_id: fr.receiver_id,
        status: 'accepted'
      });

      // Mark friend request as accepted
      await fr.update({ status: 'accepted' });

      res.json({ message: "Friend request accepted", friendship });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  reject: async (req, res) => {
    try {
      const fr = await FriendRequest.findByPk(req.params.id);
      if (!fr) return res.status(404).json({ message: "Friend request not found" });

      // Only the receiver can reject
      if (fr.receiver_id !== req.user?.id) {
        return res.status(403).json({ error: 'Only receiver can reject friend request' });
      }

      // Mark friend request as rejected
      await fr.update({ status: 'rejected' });

      res.json({ message: "Friend request rejected" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

