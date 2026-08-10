-- Medical Records Migration (Immutable Design)

CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  parent_record_id UUID REFERENCES medical_records(id), -- For Amendments
  diagnosis TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_med_records_patient ON medical_records(patient_id);
CREATE INDEX idx_med_records_appointment ON medical_records(appointment_id);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id),
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id),
  test_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
  result_data TEXT NOT NULL,
  reference_range VARCHAR(255),
  is_abnormal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DATABASE TRIGGER: IMMUTABLE MEDICAL RECORDS
-- ==========================================
-- This trigger blocks any UPDATE or DELETE operations on the medical_records table.
-- It enforces the append-only (Amendment) clinical design pattern.

CREATE OR REPLACE FUNCTION prevent_medical_record_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CLINICAL_DATA_ERROR: Medical records are immutable and cannot be updated or deleted. Please create an amendment (new record pointing to the old one).';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_med_record_mod
BEFORE UPDATE OR DELETE ON medical_records
FOR EACH ROW EXECUTE FUNCTION prevent_medical_record_modification();
