-- =============================================
-- NaatHub Database Schema
-- =============================================

-- Users Table
CREATE TABLE public.users (
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    profile_pic_url character varying(500),
    bio text,
    role character varying(50) DEFAULT 'listener'::character varying,
    is_active boolean DEFAULT true,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id bigint NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT role_check CHECK (((role)::text = ANY ((ARRAY['listener'::character varying, 'artist'::character varying, 'moderator'::character varying, 'admin'::character varying])::text[])))
);

-- Users Sequence
CREATE SEQUENCE public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);

-- Users Constraints
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

-- Users Index
CREATE INDEX idx_users_role ON public.users USING btree (role);

-- Naats Table
CREATE TABLE public.naats (
    naat_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    audio_filename character varying(255) NOT NULL,
    duration_seconds integer NOT NULL,
    category character varying(100) NOT NULL,
    like_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    artist_id bigint NOT NULL
);

-- Naats Sequences
CREATE SEQUENCE public.naats_naat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.naats_artist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY public.naats ALTER COLUMN naat_id SET DEFAULT nextval('public.naats_naat_id_seq'::regclass);
ALTER TABLE ONLY public.naats ALTER COLUMN artist_id SET DEFAULT nextval('public.naats_artist_id_seq'::regclass);

-- Naats Constraints
ALTER TABLE ONLY public.naats
    ADD CONSTRAINT naats_pkey PRIMARY KEY (naat_id);

-- Naats Index
CREATE INDEX idx_naats_category ON public.naats USING btree (category);

-- Reports Table
CREATE TABLE public.reports (
    report_id bigint NOT NULL,
    reported_naat_id integer,
    report_type character varying(50) NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reporter_id bigint NOT NULL,
    reported_user_id bigint NOT NULL,
    resolution character varying,
    action_taken character varying DEFAULT 'no_action'::character varying,
    resolved_by bigint,
    resolved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Reports Sequences
CREATE SEQUENCE public.reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.reports_reporter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.reports_reported_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.reports_resolved_by_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE ONLY public.reports ALTER COLUMN report_id SET DEFAULT nextval('public.reports_report_id_seq'::regclass);
ALTER TABLE ONLY public.reports ALTER COLUMN reporter_id SET DEFAULT nextval('public.reports_reporter_id_seq'::regclass);
ALTER TABLE ONLY public.reports ALTER COLUMN reported_user_id SET DEFAULT nextval('public.reports_reported_user_id_seq'::regclass);
ALTER TABLE ONLY public.reports ALTER COLUMN resolved_by SET DEFAULT nextval('public.reports_resolved_by_seq'::regclass);

-- Reports Constraints
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);

ALTER TABLE public.reports
    ADD CONSTRAINT action_taken_chk CHECK (((action_taken)::text = ANY (ARRAY[('delete_naat'::character varying)::text, ('delete_user'::character varying)::text, ('warning'::character varying)::text, ('no_action'::character varying)::text])));

-- Reports Index
CREATE INDEX idx_reports_status ON public.reports USING btree (status);

-- Foreign Key Constraints
ALTER TABLE ONLY public.naats
    ADD CONSTRAINT artist_id_fk FOREIGN KEY (artist_id) REFERENCES public.users(user_id);

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_naat_id_fkey FOREIGN KEY (reported_naat_id) REFERENCES public.naats(naat_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(user_id);

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reported_user_id_fk FOREIGN KEY (reported_user_id) REFERENCES public.users(user_id);