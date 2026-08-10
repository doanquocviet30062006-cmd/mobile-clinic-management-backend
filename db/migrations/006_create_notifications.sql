-- Notification Module Migration

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,  -- e.g., 'APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'RECORD_CREATED'
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(50),    -- e.g., 'appointment', 'medical_record'
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
