--
-- PostgreSQL database dump
--

\restrict CJdFvskI1YgkLer80xXRMEMGCTPX69Y9Qjgc6nWHQtdEx8UlndFrQ3cfHFDyrwe

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accessgroup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessgroup (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    accesskey character varying(255) NOT NULL,
    privileges jsonb DEFAULT '{}'::jsonb,
    membercount integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: accessgroup_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accessgroup_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accessgroup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accessgroup_id_seq OWNED BY public.accessgroup.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    pname text,
    name text NOT NULL,
    brand text,
    quantity integer DEFAULT 0.0000,
    vquantity integer DEFAULT 0.0000,
    price numeric(15,2) DEFAULT 0.00,
    model text,
    variant text,
    color text,
    category text[] DEFAULT '{}'::text[],
    resource jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: inventoryassessmap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventoryassessmap (
    id integer NOT NULL,
    accessgroupid integer NOT NULL,
    inventoryid integer NOT NULL,
    quantity integer DEFAULT 0.0000,
    price numeric(15,2) DEFAULT 0.00,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: inventoryassessmap_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventoryassessmap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventoryassessmap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventoryassessmap_id_seq OWNED BY public.inventoryassessmap.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    userid integer CONSTRAINT app_users_userid_not_null NOT NULL,
    email character varying(255) CONSTRAINT app_users_email_not_null NOT NULL,
    password character varying(255) CONSTRAINT app_users_password_not_null NOT NULL,
    accessgroupid integer,
    usertype character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_userid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_userid_seq OWNED BY public.users.userid;


--
-- Name: accessgroup id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessgroup ALTER COLUMN id SET DEFAULT nextval('public.accessgroup_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: inventoryassessmap id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventoryassessmap ALTER COLUMN id SET DEFAULT nextval('public.inventoryassessmap_id_seq'::regclass);


--
-- Name: users userid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN userid SET DEFAULT nextval('public.users_userid_seq'::regclass);


--
-- Name: accessgroup accessgroup_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessgroup
    ADD CONSTRAINT accessgroup_name_key UNIQUE (name);


--
-- Name: accessgroup accessgroup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessgroup
    ADD CONSTRAINT accessgroup_pkey PRIMARY KEY (id);


--
-- Name: users app_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT app_users_email_key UNIQUE (email);


--
-- Name: users app_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT app_users_pkey PRIMARY KEY (userid);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: inventoryassessmap inventoryassessmap_accessgroupid_inventoryid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventoryassessmap
    ADD CONSTRAINT inventoryassessmap_accessgroupid_inventoryid_key UNIQUE (accessgroupid, inventoryid);


--
-- Name: inventoryassessmap inventoryassessmap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventoryassessmap
    ADD CONSTRAINT inventoryassessmap_pkey PRIMARY KEY (id);


--
-- Name: idx_accessgroup_accesskey; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accessgroup_accesskey ON public.accessgroup USING btree (accesskey);


--
-- Name: idx_accessgroup_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accessgroup_name ON public.accessgroup USING btree (name);


--
-- Name: idx_app_users_accessgroup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_users_accessgroup ON public.users USING btree (accessgroupid);


--
-- Name: idx_app_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_users_email ON public.users USING btree (email);


--
-- Name: idx_app_users_usertype; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_users_usertype ON public.users USING btree (usertype);


--
-- Name: idx_invassess_accessgroup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invassess_accessgroup ON public.inventoryassessmap USING btree (accessgroupid);


--
-- Name: idx_invassess_inventory; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invassess_inventory ON public.inventoryassessmap USING btree (inventoryid);


--
-- Name: idx_inventory_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_brand ON public.inventory USING btree (brand);


--
-- Name: idx_inventory_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_name ON public.inventory USING btree (name);


--
-- Name: idx_inventory_pname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_pname ON public.inventory USING btree (pname);


--
-- Name: users app_users_accessgroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT app_users_accessgroupid_fkey FOREIGN KEY (accessgroupid) REFERENCES public.accessgroup(id) ON DELETE SET NULL;


--
-- Name: inventoryassessmap inventoryassessmap_accessgroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventoryassessmap
    ADD CONSTRAINT inventoryassessmap_accessgroupid_fkey FOREIGN KEY (accessgroupid) REFERENCES public.accessgroup(id) ON DELETE CASCADE;


--
-- Name: inventoryassessmap inventoryassessmap_inventoryid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventoryassessmap
    ADD CONSTRAINT inventoryassessmap_inventoryid_fkey FOREIGN KEY (inventoryid) REFERENCES public.inventory(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict CJdFvskI1YgkLer80xXRMEMGCTPX69Y9Qjgc6nWHQtdEx8UlndFrQ3cfHFDyrwe

