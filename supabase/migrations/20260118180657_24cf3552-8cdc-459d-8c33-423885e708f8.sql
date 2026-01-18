-- Fix function search_path for update_conversation_stats
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations SET
    message_count = message_count + 1,
    token_count = token_count + COALESCE(NEW.tokens_used, 0),
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search_path for auto_title_conversation
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE ai_conversations SET
      title = COALESCE(title, LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END)
    WHERE id = NEW.conversation_id AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;