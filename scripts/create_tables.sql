
CREATE TYPE task_state_enum AS ENUM ('Todo', 'InProgress', 'Review', 'Done');
CREATE TYPE user_board_role_enum AS ENUM ('Owner', 'Editor', 'Reviewer', 'Reader');

CREATE TABLE users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    email  TEXT UNIQUE NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE boards (
    id UUID NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    description  TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE user_boards (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
    role user_board_role_enum NOT NULL DEFAULT 'Reader'

);


CREATE TABLE tasks (
    id UUID NOT NULL PRIMARY KEY,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description  TEXT,
    state task_state_enum NOT NULL DEFAULT 'Todo',
    assigned_to UUID REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE task_changes (
    id UUID NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    description  TEXT,
    state task_state_enum NOT NULL DEFAULT 'Todo',
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
    modification_ts TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);




ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_changes ENABLE ROW LEVEL SECURITY;