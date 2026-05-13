CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    department_id INT REFERENCES departments(department_id) ON DELETE SET NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (
        role IN ('Admin', 'Oncologist', 'Oncology Nurse', 'Radiologist', 'Pharmacist', 'Patient')
    ),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    staff_profile_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    bio TEXT,
    joined_date DATE
);

CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE SET NULL,
    rsn VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_no VARCHAR(20),
    sex VARCHAR(10) CHECK (sex IN ('m', 'f')),
    age INT CHECK (age >= 0),
    blood_type VARCHAR(5),
    diagnosis VARCHAR(150),
    cancer_stage VARCHAR(50),
    next_visit DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_care_team (
    care_team_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    team_role VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_from DATE,
    assigned_to DATE
);

CREATE TABLE IF NOT EXISTS care_plans (
    care_plan_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    treatment_goal VARCHAR(150),
    active_protocol VARCHAR(150),
    treatment_type VARCHAR(50),
    treatment_frequency VARCHAR(100),
    total_sessions INT DEFAULT 0 CHECK (total_sessions >= 0),
    completed_sessions INT DEFAULT 0 CHECK (completed_sessions >= 0),
    remaining_sessions INT DEFAULT 0 CHECK (remaining_sessions >= 0),
    next_treatment_at TIMESTAMP,
    lab_monitoring TEXT,
    supportive_care TEXT,
    care_instructions TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatment_units (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL UNIQUE,
    unit_type VARCHAR(30) NOT NULL CHECK (
        unit_type IN ('chemotherapy', 'radiotherapy', 'follow_up', 'supportive_care')
    ),
    floor_number INT NOT NULL CHECK (floor_number > 0),
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('available', 'busy', 'maintenance')
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unit_resources (
    resource_id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL REFERENCES treatment_units(unit_id) ON DELETE CASCADE,
    resource_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    resource_status VARCHAR(30) DEFAULT 'available',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    unit_id INT REFERENCES treatment_units(unit_id) ON DELETE SET NULL,
    care_plan_id INT REFERENCES care_plans(care_plan_id) ON DELETE SET NULL,
    appointment_type VARCHAR(50) NOT NULL CHECK (
        appointment_type IN (
            'chemotherapy',
            'radiotherapy',
            'follow_up',
            'supportive_care',
            'lab_review',
            'oncology_review',
            'imaging_review',
            'nutrition_check_in'
        )
    ),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'done', 'canceled')
    ),
    protocol VARCHAR(150),
    notes TEXT,
    attendance_status VARCHAR(30) DEFAULT 'pending',
    patient_requested BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_unit_date_time
ON appointments (unit_id, appointment_date, start_time, end_time)
WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS appointment_staff (
    appointment_staff_id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    staff_role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    prescribed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    medication VARCHAR(150) NOT NULL,
    instructions TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_uploads (
    upload_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(80) NOT NULL,
    notes TEXT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communications (
    communication_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE SET NULL,
    sender_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('email', 'portal_message')),
    subject VARCHAR(180) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'prepared',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS google_calendar_connections (
    connection_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    scope TEXT,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
