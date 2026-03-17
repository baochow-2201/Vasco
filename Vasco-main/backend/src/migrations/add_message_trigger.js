// Migration: Add trigger for real-time message notifications
const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, DataTypes) => {
    try {
      const sequelize = queryInterface.sequelize;
      
      // Create trigger function for new messages - instant delivery
      const createTriggerFunction = `
        CREATE OR REPLACE FUNCTION notify_new_message()
        RETURNS TRIGGER AS $$
        BEGIN
          PERFORM pg_notify(
            'new_message',
            json_build_object(
              'id', NEW.id,
              'conversation_id', NEW.conversation_id,
              'sender_id', NEW.sender_id,
              'receiver_id', NEW.receiver_id,
              'content', NEW.content,
              'media_url', NEW.media_url,
              'created_at', NEW.created_at
            )::text
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create trigger on messages table
      const createTrigger = `
        DROP TRIGGER IF EXISTS messages_insert_trigger ON messages;
        CREATE TRIGGER messages_insert_trigger
        AFTER INSERT ON messages
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_message();
      `;

      // Execute trigger creation statements
      await sequelize.query(createTriggerFunction, { raw: true });
      console.log('✓ Created trigger function for instant message delivery');

      await sequelize.query(createTrigger, { raw: true });
      console.log('✓ Created trigger for INSERT on messages');

      console.log('✅ Successfully added message triggers for real-time instant delivery');
    } catch (error) {
      console.error('❌ Error creating triggers:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, DataTypes) => {
    try {
      const sequelize = queryInterface.sequelize;

      // Drop trigger
      await sequelize.query('DROP TRIGGER IF EXISTS messages_insert_trigger ON messages;');

      // Drop trigger function
      await sequelize.query('DROP FUNCTION IF EXISTS notify_new_message();');

      console.log('✓ Successfully removed message triggers');
    } catch (error) {
      console.error('❌ Error removing triggers:', error.message);
      throw error;
    }
  }
};
