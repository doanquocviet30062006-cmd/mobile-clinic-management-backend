-- Master Data Migration

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  full_name_encrypted VARCHAR(255) NOT NULL,
  phone_encrypted VARCHAR(255) NOT NULL,
  id_card_encrypted VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_patients_user_id ON patients(user_id);

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  specialty VARCHAR(255) NOT NULL,
  qualifications TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating_avg NUMERIC(3, 2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- e.g. 'patient'
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- e.g. 'CREATE', 'UPDATE'
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
