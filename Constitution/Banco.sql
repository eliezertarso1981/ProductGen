-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP TYPE public."citext";

CREATE TYPE public."citext" (
	INPUT = citextin,
	OUTPUT = citextout,
	RECEIVE = citextrecv,
	SEND = citextsend,
	ALIGNMENT = 4,
	STORAGE = any,
	CATEGORY = S,
	DELIMITER = ',',
	COLLATABLE = true);

-- DROP TYPE public."delivery_status";

CREATE TYPE public."delivery_status" AS ENUM (
	'proposed',
	'planned',
	'in_development',
	'in_validation',
	'delivered',
	'measuring_outcome',
	'cancelled',
	'rolled_back');

-- DROP TYPE public."delivery_type";

CREATE TYPE public."delivery_type" AS ENUM (
	'initiative',
	'epic',
	'feature');

-- DROP TYPE public."evidence_source";

CREATE TYPE public."evidence_source" AS ENUM (
	'interview',
	'support_ticket',
	'nps',
	'sales_call',
	'usage_data',
	'survey',
	'review',
	'internal',
	'analytics',
	'other');

-- DROP TYPE public."evidence_status";

CREATE TYPE public."evidence_status" AS ENUM (
	'new',
	'triaged',
	'linked',
	'archived');

-- DROP TYPE public."experiment_result";

CREATE TYPE public."experiment_result" AS ENUM (
	'validated',
	'invalidated',
	'inconclusive');

-- DROP TYPE public."experiment_status";

CREATE TYPE public."experiment_status" AS ENUM (
	'planned',
	'running',
	'completed',
	'analyzed');

-- DROP TYPE public.gtrgm;

CREATE TYPE public.gtrgm (
	INPUT = gtrgm_in,
	OUTPUT = gtrgm_out,
	ALIGNMENT = 4,
	STORAGE = plain,
	CATEGORY = U,
	DELIMITER = ',');

-- DROP TYPE public."hypothesis_status";

CREATE TYPE public."hypothesis_status" AS ENUM (
	'formulated',
	'validating',
	'validated',
	'invalidated',
	'in_execution',
	'delivered',
	'deprioritized',
	'discarded');

-- DROP TYPE public."lifecycle_stage";

CREATE TYPE public."lifecycle_stage" AS ENUM (
	'development',
	'introduction',
	'growth',
	'maturity',
	'decline');

-- DROP TYPE public.lquery;

CREATE TYPE public.lquery (
	INPUT = lquery_in,
	OUTPUT = lquery_out,
	RECEIVE = lquery_recv,
	SEND = lquery_send,
	ALIGNMENT = 4,
	STORAGE = any,
	CATEGORY = U,
	DELIMITER = ',');

-- DROP TYPE public.ltree;

CREATE TYPE public.ltree (
	INPUT = ltree_in,
	OUTPUT = ltree_out,
	RECEIVE = ltree_recv,
	SEND = ltree_send,
	ALIGNMENT = 4,
	STORAGE = any,
	CATEGORY = U,
	DELIMITER = ',');

-- DROP TYPE public.ltree_gist;

CREATE TYPE public.ltree_gist (
	INPUT = ltree_gist_in,
	OUTPUT = ltree_gist_out,
	ALIGNMENT = 4,
	STORAGE = plain,
	CATEGORY = U,
	DELIMITER = ',');

-- DROP TYPE public.ltxtquery;

CREATE TYPE public.ltxtquery (
	INPUT = ltxtq_in,
	OUTPUT = ltxtq_out,
	RECEIVE = ltxtq_recv,
	SEND = ltxtq_send,
	ALIGNMENT = 4,
	STORAGE = any,
	CATEGORY = U,
	DELIMITER = ',');

-- DROP TYPE public."metric_type";

CREATE TYPE public."metric_type" AS ENUM (
	'north_star',
	'kpi',
	'counter_metric',
	'guardrail_metric');

-- DROP TYPE public."objective_status";

CREATE TYPE public."objective_status" AS ENUM (
	'draft',
	'active',
	'completed',
	'cancelled');

-- DROP TYPE public."outcome_status";

CREATE TYPE public."outcome_status" AS ENUM (
	'hypothesized',
	'measuring',
	'achieved',
	'not_achieved',
	'cancelled');

-- DROP TYPE public."pain_status";

CREATE TYPE public."pain_status" AS ENUM (
	'identified',
	'investigating',
	'prioritized',
	'addressed',
	'resolved',
	'discarded',
	'merged',
	'split');

-- DROP TYPE public."pain_type";

CREATE TYPE public."pain_type" AS ENUM (
	'canonical',
	'standard');

-- DROP TYPE public."product_role";

CREATE TYPE public."product_role" AS ENUM (
	'director',
	'cpo',
	'gpm',
	'pm',
	'po',
	'ux',
	'pd',
	'stakeholder');

-- DROP TYPE public."relationship_type";

CREATE TYPE public."relationship_type" AS ENUM (
	'related_to',
	'causes',
	'supports',
	'blocks',
	'duplicates',
	'merged_from',
	'split_from',
	'generated_from',
	'inspired_by',
	'measures',
	'impacts');

-- DROP TYPE public."visibility_level";

CREATE TYPE public."visibility_level" AS ENUM (
	'public',
	'private',
	'restricted');

-- DROP TYPE public."workspace_role";

CREATE TYPE public."workspace_role" AS ENUM (
	'admin',
	'member',
	'stakeholder');
-- public.users definição

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	email public."citext" NOT NULL,
	"name" text NOT NULL,
	nickname text NULL,
	primary_role text NULL,
	bio text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trg_users_updated_at before
update
    on
    public.users for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;


-- public.workspaces definição

-- Drop table

-- DROP TABLE public.workspaces;

CREATE TABLE public.workspaces (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	slug text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT workspaces_pkey PRIMARY KEY (id),
	CONSTRAINT workspaces_slug_key UNIQUE (slug)
);

-- Table Triggers

create trigger trg_workspaces_updated_at before
update
    on
    public.workspaces for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.workspaces OWNER TO postgres;
GRANT ALL ON TABLE public.workspaces TO postgres;


-- public."comments" definição

-- Drop table

-- DROP TABLE public."comments";

CREATE TABLE public."comments" (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	parent_comment_id uuid NULL,
	"content" text NOT NULL,
	visibility public."visibility_level" DEFAULT 'public'::visibility_level NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT comments_pkey PRIMARY KEY (id),
	CONSTRAINT comments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public."comments"(id),
	CONSTRAINT comments_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_comments_entity ON public.comments USING btree (entity_type, entity_id);

-- Permissions

ALTER TABLE public."comments" OWNER TO postgres;
GRANT ALL ON TABLE public."comments" TO postgres;


-- public.decision_logs definição

-- Drop table

-- DROP TABLE public.decision_logs;

CREATE TABLE public.decision_logs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	decision_type text NOT NULL,
	title text NOT NULL,
	rationale text NOT NULL,
	impact_analysis text NULL,
	decided_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT decision_logs_pkey PRIMARY KEY (id),
	CONSTRAINT decision_logs_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id),
	CONSTRAINT decision_logs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.decision_logs OWNER TO postgres;
GRANT ALL ON TABLE public.decision_logs TO postgres;


-- public.entity_embeddings definição

-- Drop table

-- DROP TABLE public.entity_embeddings;

CREATE TABLE public.entity_embeddings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	embedding jsonb NULL,
	embedding_model text NULL,
	generated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT entity_embeddings_entity_type_entity_id_key UNIQUE (entity_type, entity_id),
	CONSTRAINT entity_embeddings_pkey PRIMARY KEY (id),
	CONSTRAINT entity_embeddings_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.entity_embeddings OWNER TO postgres;
GRANT ALL ON TABLE public.entity_embeddings TO postgres;


-- public.entity_events definição

-- Drop table

-- DROP TABLE public.entity_events;

CREATE TABLE public.entity_events (
	id uuid NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	event_type text NOT NULL,
	from_status text NULL,
	to_status text NULL,
	reason text NULL,
	actor_id uuid NULL,
	correlation_id uuid NULL,
	causation_id uuid NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	occurred_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT entity_events_pkey1 PRIMARY KEY (id, occurred_at),
	CONSTRAINT entity_events_actor_id_fkey1 FOREIGN KEY (actor_id) REFERENCES public.users(id),
	CONSTRAINT entity_events_workspace_id_fkey1 FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
)
PARTITION BY RANGE (occurred_at);

-- Permissions

ALTER TABLE public.entity_events OWNER TO postgres;
GRANT ALL ON TABLE public.entity_events TO postgres;


-- public.entity_events_2026 definição

CREATE TABLE public.entity_events_2026 PARTITION OF public.entity_events  FOR VALUES FROM ('2026-01-01 00:00:00-03') TO ('2027-01-01 00:00:00-03');


-- public.entity_events_2027 definição

CREATE TABLE public.entity_events_2027 PARTITION OF public.entity_events  FOR VALUES FROM ('2027-01-01 00:00:00-03') TO ('2028-01-01 00:00:00-03');


-- public.entity_events_2028 definição

CREATE TABLE public.entity_events_2028 PARTITION OF public.entity_events  FOR VALUES FROM ('2028-01-01 00:00:00-03') TO ('2029-01-01 00:00:00-03');


-- public.entity_followers definição

-- Drop table

-- DROP TABLE public.entity_followers;

CREATE TABLE public.entity_followers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	user_id uuid NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT entity_followers_entity_type_entity_id_user_id_key UNIQUE (entity_type, entity_id, user_id),
	CONSTRAINT entity_followers_pkey PRIMARY KEY (id),
	CONSTRAINT entity_followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
	CONSTRAINT entity_followers_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_followers_entity ON public.entity_followers USING btree (entity_type, entity_id);

-- Permissions

ALTER TABLE public.entity_followers OWNER TO postgres;
GRANT ALL ON TABLE public.entity_followers TO postgres;


-- public.entity_links definição

-- Drop table

-- DROP TABLE public.entity_links;

CREATE TABLE public.entity_links (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	source_type text NOT NULL,
	source_id uuid NOT NULL,
	target_type text NOT NULL,
	target_id uuid NOT NULL,
	"relationship_type" public."relationship_type" NOT NULL,
	strength numeric NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT entity_links_pkey PRIMARY KEY (id),
	CONSTRAINT entity_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT entity_links_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_entity_links_source ON public.entity_links USING btree (source_type, source_id);
CREATE INDEX idx_entity_links_target ON public.entity_links USING btree (target_type, target_id);

-- Permissions

ALTER TABLE public.entity_links OWNER TO postgres;
GRANT ALL ON TABLE public.entity_links TO postgres;


-- public.entity_permissions definição

-- Drop table

-- DROP TABLE public.entity_permissions;

CREATE TABLE public.entity_permissions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	user_id uuid NULL,
	"permission" text NOT NULL,
	granted_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT entity_permissions_pkey PRIMARY KEY (id),
	CONSTRAINT entity_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id),
	CONSTRAINT entity_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
	CONSTRAINT entity_permissions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_entity_permissions_entity ON public.entity_permissions USING btree (entity_type, entity_id);
CREATE INDEX idx_entity_permissions_user ON public.entity_permissions USING btree (user_id);
ALTER TABLE public.entity_permissions ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY entity_permissions_workspace_isolation ON public.entity_permissions
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.entity_permissions OWNER TO postgres;
GRANT ALL ON TABLE public.entity_permissions TO postgres;


-- public.media_assets definição

-- Drop table

-- DROP TABLE public.media_assets;

CREATE TABLE public.media_assets (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NULL,
	uploaded_by uuid NULL,
	"type" text NOT NULL,
	mime_type text NOT NULL,
	file_name text NOT NULL,
	original_url text NOT NULL,
	thumbnail_url text NULL,
	preview_url text NULL,
	storage_provider text NULL,
	storage_key text NOT NULL,
	file_size int8 NULL,
	width int4 NULL,
	height int4 NULL,
	duration_seconds int4 NULL,
	checksum text NULL,
	generated_by_ai bool DEFAULT false NULL,
	generation_prompt text NULL,
	generation_model text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT media_assets_pkey PRIMARY KEY (id),
	CONSTRAINT media_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
	CONSTRAINT media_assets_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_media_assets_created_at ON public.media_assets USING btree (created_at DESC);
CREATE INDEX idx_media_assets_deleted_at ON public.media_assets USING btree (deleted_at);
CREATE INDEX idx_media_assets_type ON public.media_assets USING btree (type);
CREATE INDEX idx_media_assets_uploaded_by ON public.media_assets USING btree (uploaded_by);
CREATE INDEX idx_media_assets_workspace ON public.media_assets USING btree (workspace_id);

-- Table Triggers

create trigger trg_media_assets_updated_at before
update
    on
    public.media_assets for each row execute function set_updated_at();
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY media_assets_workspace_isolation ON public.media_assets
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.media_assets OWNER TO postgres;
GRANT ALL ON TABLE public.media_assets TO postgres;


-- public.personas definição

-- Drop table

-- DROP TABLE public.personas;

CREATE TABLE public.personas (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	"name" text NOT NULL,
	segment text NULL,
	archetype text NULL,
	jobs_to_be_done text NULL,
	frustrations text NULL,
	goals text NULL,
	behaviors text NULL,
	demographics jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT personas_pkey PRIMARY KEY (id),
	CONSTRAINT personas_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Table Triggers

create trigger trg_personas_updated_at before
update
    on
    public.personas for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.personas OWNER TO postgres;
GRANT ALL ON TABLE public.personas TO postgres;


-- public.products definição

-- Drop table

-- DROP TABLE public.products;

CREATE TABLE public.products (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	vision text NULL,
	strategic_goal text NULL,
	north_star_metric text NULL,
	"lifecycle_stage" public."lifecycle_stage" DEFAULT 'development'::lifecycle_stage NULL,
	lifecycle_updated_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	director_id uuid NULL,
	pm_owner_id uuid NULL,
	ux_owner_id uuid NULL,
	po_owner_id uuid NULL,
	CONSTRAINT products_pkey PRIMARY KEY (id),
	CONSTRAINT trg_products_validate_ownership TRIGGER DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT products_director_id_fkey FOREIGN KEY (director_id) REFERENCES public.users(id),
	CONSTRAINT products_pm_owner_id_fkey FOREIGN KEY (pm_owner_id) REFERENCES public.users(id),
	CONSTRAINT products_po_owner_id_fkey FOREIGN KEY (po_owner_id) REFERENCES public.users(id),
	CONSTRAINT products_ux_owner_id_fkey FOREIGN KEY (ux_owner_id) REFERENCES public.users(id),
	CONSTRAINT products_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_products_workspace ON public.products USING btree (workspace_id);

-- Table Triggers

create trigger trg_products_updated_at before
update
    on
    public.products for each row execute function set_updated_at();
create constraint trigger trg_products_validate_ownership after
insert
    or
update
    on
    public.products deferrable initially deferred for each row execute function validate_product_ownership_roles();
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY products_workspace_isolation ON public.products
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.products OWNER TO postgres;
GRANT ALL ON TABLE public.products TO postgres;


-- public.releases definição

-- Drop table

-- DROP TABLE public.releases;

CREATE TABLE public.releases (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	"version" text NOT NULL,
	title text NULL,
	description text NULL,
	planned_release_date date NULL,
	actual_release_date date NULL,
	changelog text NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT releases_pkey PRIMARY KEY (id),
	CONSTRAINT releases_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT releases_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.releases OWNER TO postgres;
GRANT ALL ON TABLE public.releases TO postgres;


-- public.squads definição

-- Drop table

-- DROP TABLE public.squads;

CREATE TABLE public.squads (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT squads_pkey PRIMARY KEY (id),
	CONSTRAINT squads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT squads_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Table Triggers

create trigger trg_squads_updated_at before
update
    on
    public.squads for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.squads OWNER TO postgres;
GRANT ALL ON TABLE public.squads TO postgres;


-- public.strategic_pillars definição

-- Drop table

-- DROP TABLE public.strategic_pillars;

CREATE TABLE public.strategic_pillars (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	color text NULL,
	"position" int4 DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT strategic_pillars_pkey PRIMARY KEY (id),
	CONSTRAINT strategic_pillars_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT strategic_pillars_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Table Triggers

create trigger trg_strategic_pillars_updated_at before
update
    on
    public.strategic_pillars for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.strategic_pillars OWNER TO postgres;
GRANT ALL ON TABLE public.strategic_pillars TO postgres;


-- public.tags definição

-- Drop table

-- DROP TABLE public.tags;

CREATE TABLE public.tags (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	"name" text NOT NULL,
	color text NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT tags_pkey PRIMARY KEY (id),
	CONSTRAINT tags_workspace_id_name_key UNIQUE (workspace_id, name),
	CONSTRAINT tags_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.tags OWNER TO postgres;
GRANT ALL ON TABLE public.tags TO postgres;


-- public.workspace_members definição

-- Drop table

-- DROP TABLE public.workspace_members;

CREATE TABLE public.workspace_members (
	workspace_id uuid NOT NULL,
	user_id uuid NOT NULL,
	"role" public."workspace_role" DEFAULT 'member'::workspace_role NOT NULL,
	joined_at timestamptz DEFAULT now() NULL,
	CONSTRAINT workspace_members_pkey PRIMARY KEY (workspace_id, user_id),
	CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.workspace_members OWNER TO postgres;
GRANT ALL ON TABLE public.workspace_members TO postgres;


-- public.entity_assets definição

-- Drop table

-- DROP TABLE public.entity_assets;

CREATE TABLE public.entity_assets (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	asset_id uuid NOT NULL,
	"role" text NOT NULL,
	"position" int4 DEFAULT 0 NULL,
	is_primary bool DEFAULT false NULL,
	uploaded_by uuid NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT entity_assets_pkey PRIMARY KEY (id),
	CONSTRAINT entity_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.media_assets(id) ON DELETE CASCADE,
	CONSTRAINT entity_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id),
	CONSTRAINT entity_assets_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_entity_assets_asset ON public.entity_assets USING btree (asset_id);
CREATE INDEX idx_entity_assets_entity ON public.entity_assets USING btree (entity_type, entity_id);
CREATE INDEX idx_entity_assets_primary ON public.entity_assets USING btree (entity_type, entity_id, is_primary);
CREATE INDEX idx_entity_assets_role ON public.entity_assets USING btree (role);
CREATE UNIQUE INDEX idx_entity_assets_unique_primary ON public.entity_assets USING btree (entity_type, entity_id, role) WHERE ((is_primary = true) AND (deleted_at IS NULL));
CREATE INDEX idx_entity_assets_workspace ON public.entity_assets USING btree (workspace_id);
ALTER TABLE public.entity_assets ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY entity_assets_workspace_isolation ON public.entity_assets
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.entity_assets OWNER TO postgres;
GRANT ALL ON TABLE public.entity_assets TO postgres;


-- public.entity_assignments definição

-- Drop table

-- DROP TABLE public.entity_assignments;

CREATE TABLE public.entity_assignments (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	user_id uuid NULL,
	squad_id uuid NULL,
	assignment_role text NOT NULL,
	assigned_by uuid NULL,
	assigned_at timestamptz DEFAULT now() NULL,
	unassigned_at timestamptz NULL,
	is_primary bool DEFAULT false NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT entity_assignments_pkey PRIMARY KEY (id),
	CONSTRAINT entity_assignments_user_or_squad_check CHECK (((user_id IS NOT NULL) OR (squad_id IS NOT NULL))) NOT VALID,
	CONSTRAINT entity_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id),
	CONSTRAINT entity_assignments_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id),
	CONSTRAINT entity_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
	CONSTRAINT entity_assignments_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_entity_assignments_entity ON public.entity_assignments USING btree (entity_type, entity_id);
CREATE INDEX idx_entity_assignments_squad ON public.entity_assignments USING btree (squad_id);
CREATE UNIQUE INDEX idx_entity_assignments_unique_primary ON public.entity_assignments USING btree (entity_type, entity_id, assignment_role) WHERE ((is_primary = true) AND (unassigned_at IS NULL));
CREATE INDEX idx_entity_assignments_user ON public.entity_assignments USING btree (user_id);

-- Permissions

ALTER TABLE public.entity_assignments OWNER TO postgres;
GRANT ALL ON TABLE public.entity_assignments TO postgres;


-- public.entity_tags definição

-- Drop table

-- DROP TABLE public.entity_tags;

CREATE TABLE public.entity_tags (
	entity_type text NOT NULL,
	entity_id uuid NOT NULL,
	tag_id uuid NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT entity_tags_pkey PRIMARY KEY (entity_type, entity_id, tag_id),
	CONSTRAINT entity_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.entity_tags OWNER TO postgres;
GRANT ALL ON TABLE public.entity_tags TO postgres;


-- public.evidences definição

-- Drop table

-- DROP TABLE public.evidences;

CREATE TABLE public.evidences (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NULL,
	title text NOT NULL,
	description text NOT NULL,
	"source" public."evidence_source" NOT NULL,
	source_url text NULL,
	customer_identifier text NULL,
	confidence_score numeric NULL,
	evidence_strength numeric NULL,
	sample_size int4 NULL,
	status public."evidence_status" DEFAULT 'new'::evidence_status NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	search_vector tsvector NULL,
	created_by uuid NULL,
	collected_at timestamptz DEFAULT now() NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	owner_id uuid NULL,
	CONSTRAINT evidences_pkey PRIMARY KEY (id),
	CONSTRAINT evidences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT evidences_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT evidences_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT evidences_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_evidences_deleted_at ON public.evidences USING btree (deleted_at);
CREATE INDEX idx_evidences_owner ON public.evidences USING btree (owner_id);
CREATE INDEX idx_evidences_search ON public.evidences USING gin (search_vector);

-- Table Triggers

create trigger trg_evidences_search before
insert
    or
update
    on
    public.evidences for each row execute function update_search_vector();
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY evidences_workspace_isolation ON public.evidences
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.evidences OWNER TO postgres;
GRANT ALL ON TABLE public.evidences TO postgres;


-- public.hypotheses definição

-- Drop table

-- DROP TABLE public.hypotheses;

CREATE TABLE public.hypotheses (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	title text NOT NULL,
	if_clause text NOT NULL,
	then_clause text NOT NULL,
	because_clause text NOT NULL,
	assumptions jsonb DEFAULT '[]'::jsonb NULL,
	confidence int4 NULL,
	priority_score numeric NULL,
	impact_score numeric NULL,
	effort_score numeric NULL,
	status public."hypothesis_status" DEFAULT 'formulated'::hypothesis_status NULL,
	outcome_summary text NULL,
	owner_id uuid NULL,
	search_vector tsvector NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	created_by uuid NULL,
	scoring_method text NULL,
	scoring_payload jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT hypotheses_confidence_check CHECK (((confidence >= 1) AND (confidence <= 5))),
	CONSTRAINT hypotheses_pkey PRIMARY KEY (id),
	CONSTRAINT hypotheses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT hypotheses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT hypotheses_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT hypotheses_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_hypotheses_created_by ON public.hypotheses USING btree (created_by);
CREATE INDEX idx_hypotheses_deleted_at ON public.hypotheses USING btree (deleted_at);
CREATE INDEX idx_hypotheses_owner ON public.hypotheses USING btree (owner_id);
CREATE INDEX idx_hypotheses_product ON public.hypotheses USING btree (product_id);
CREATE INDEX idx_hypotheses_search ON public.hypotheses USING gin (search_vector);
CREATE INDEX idx_hypotheses_status ON public.hypotheses USING btree (status);
CREATE INDEX idx_hypotheses_workspace ON public.hypotheses USING btree (workspace_id);

-- Table Triggers

create trigger trg_hypotheses_search before
insert
    or
update
    on
    public.hypotheses for each row execute function update_search_vector();
create trigger trg_hypotheses_updated_at before
update
    on
    public.hypotheses for each row execute function set_updated_at();
ALTER TABLE public.hypotheses ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY hypotheses_workspace_isolation ON public.hypotheses
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.hypotheses OWNER TO postgres;
GRANT ALL ON TABLE public.hypotheses TO postgres;


-- public.insights definição

-- Drop table

-- DROP TABLE public.insights;

CREATE TABLE public.insights (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NULL,
	title text NOT NULL,
	description text NOT NULL,
	confidence_score numeric NULL,
	impact_score numeric NULL,
	frequency_score numeric NULL,
	evidence_count int4 DEFAULT 0 NULL,
	owner_id uuid NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	search_vector tsvector NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT insights_pkey PRIMARY KEY (id),
	CONSTRAINT insights_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT insights_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT insights_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_insights_deleted_at ON public.insights USING btree (deleted_at);
CREATE INDEX idx_insights_search ON public.insights USING gin (search_vector);

-- Table Triggers

create trigger trg_insights_search before
insert
    or
update
    on
    public.insights for each row execute function update_search_vector();
create trigger trg_insights_updated_at before
update
    on
    public.insights for each row execute function set_updated_at();
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY insights_workspace_isolation ON public.insights
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.insights OWNER TO postgres;
GRANT ALL ON TABLE public.insights TO postgres;


-- public.objectives definição

-- Drop table

-- DROP TABLE public.objectives;

CREATE TABLE public.objectives (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	title text NOT NULL,
	description text NULL,
	status public."objective_status" DEFAULT 'draft'::objective_status NULL,
	horizon_start date NULL,
	horizon_end date NULL,
	owner_id uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT objectives_pkey PRIMARY KEY (id),
	CONSTRAINT objectives_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT objectives_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT objectives_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_objectives_deleted_at ON public.objectives USING btree (deleted_at);
CREATE INDEX idx_objectives_product ON public.objectives USING btree (product_id);
CREATE INDEX idx_objectives_workspace ON public.objectives USING btree (workspace_id);

-- Table Triggers

create trigger trg_objectives_updated_at before
update
    on
    public.objectives for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.objectives OWNER TO postgres;
GRANT ALL ON TABLE public.objectives TO postgres;


-- public.pains definição

-- Drop table

-- DROP TABLE public.pains;

CREATE TABLE public.pains (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	canonical_pain_id uuid NULL,
	parent_pain_id uuid NULL,
	root_pain_id uuid NULL,
	"type" public."pain_type" DEFAULT 'standard'::pain_type NULL,
	title text NOT NULL,
	description text NULL,
	status public."pain_status" DEFAULT 'identified'::pain_status NULL,
	severity int4 NULL,
	reach_estimate int4 NULL,
	confidence_score numeric NULL,
	priority_score numeric NULL,
	owner_id uuid NULL,
	search_vector tsvector NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	scoring_method text NULL,
	scoring_payload jsonb DEFAULT '{}'::jsonb NULL,
	deleted_at timestamptz NULL,
	created_by uuid NULL,
	CONSTRAINT pains_pkey PRIMARY KEY (id),
	CONSTRAINT pains_severity_check CHECK (((severity >= 1) AND (severity <= 5))),
	CONSTRAINT pains_canonical_pain_id_fkey FOREIGN KEY (canonical_pain_id) REFERENCES public.pains(id),
	CONSTRAINT pains_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT pains_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT pains_parent_pain_id_fkey FOREIGN KEY (parent_pain_id) REFERENCES public.pains(id),
	CONSTRAINT pains_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT pains_root_pain_id_fkey FOREIGN KEY (root_pain_id) REFERENCES public.pains(id),
	CONSTRAINT pains_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_pains_created_by ON public.pains USING btree (created_by);
CREATE INDEX idx_pains_deleted_at ON public.pains USING btree (deleted_at);
CREATE INDEX idx_pains_owner ON public.pains USING btree (owner_id);
CREATE INDEX idx_pains_product ON public.pains USING btree (product_id);
CREATE INDEX idx_pains_search ON public.pains USING gin (search_vector);
CREATE INDEX idx_pains_status ON public.pains USING btree (status);
CREATE INDEX idx_pains_workspace ON public.pains USING btree (workspace_id);

-- Table Triggers

create trigger trg_pains_search before
insert
    or
update
    on
    public.pains for each row execute function update_search_vector();
create trigger trg_pains_updated_at before
update
    on
    public.pains for each row execute function set_updated_at();
ALTER TABLE public.pains ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY pains_workspace_isolation ON public.pains
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.pains OWNER TO postgres;
GRANT ALL ON TABLE public.pains TO postgres;


-- public.product_members definição

-- Drop table

-- DROP TABLE public.product_members;

CREATE TABLE public.product_members (
	product_id uuid NOT NULL,
	user_id uuid NOT NULL,
	"role" public."product_role" NOT NULL,
	joined_at timestamptz DEFAULT now() NULL,
	CONSTRAINT product_members_pkey PRIMARY KEY (product_id, user_id),
	CONSTRAINT product_members_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
	CONSTRAINT product_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.product_members OWNER TO postgres;
GRANT ALL ON TABLE public.product_members TO postgres;


-- public.product_metrics definição

-- Drop table

-- DROP TABLE public.product_metrics;

CREATE TABLE public.product_metrics (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	"type" public."metric_type" NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	current_value numeric NULL,
	target_value numeric NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT product_metrics_pkey PRIMARY KEY (id),
	CONSTRAINT product_metrics_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT product_metrics_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Table Triggers

create trigger trg_product_metrics_updated_at before
update
    on
    public.product_metrics for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.product_metrics OWNER TO postgres;
GRANT ALL ON TABLE public.product_metrics TO postgres;


-- public.product_personas definição

-- Drop table

-- DROP TABLE public.product_personas;

CREATE TABLE public.product_personas (
	product_id uuid NOT NULL,
	persona_id uuid NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT product_personas_pkey PRIMARY KEY (product_id, persona_id),
	CONSTRAINT product_personas_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE CASCADE,
	CONSTRAINT product_personas_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.product_personas OWNER TO postgres;
GRANT ALL ON TABLE public.product_personas TO postgres;


-- public.roadmap_items definição

-- Drop table

-- DROP TABLE public.roadmap_items;

CREATE TABLE public.roadmap_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	product_id uuid NOT NULL,
	pillar_id uuid NULL,
	parent_id uuid NULL,
	"path" public.ltree NULL,
	"type" public."delivery_type" NOT NULL,
	title text NOT NULL,
	description text NULL,
	status public."delivery_status" DEFAULT 'proposed'::delivery_status NULL,
	priority_score numeric NULL,
	complexity_score numeric NULL,
	impact_score numeric NULL,
	acceptance_criteria text NULL,
	analytics_requirements text NULL,
	rollout_strategy text NULL,
	rollback_strategy text NULL,
	release_version text NULL,
	external_system text NULL,
	external_id text NULL,
	external_url text NULL,
	owner_id uuid NULL,
	search_vector tsvector NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	scoring_method text NULL,
	scoring_payload jsonb DEFAULT '{}'::jsonb NULL,
	deleted_at timestamptz NULL,
	created_by uuid NULL,
	CONSTRAINT roadmap_items_pkey PRIMARY KEY (id),
	CONSTRAINT roadmap_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT roadmap_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT roadmap_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.roadmap_items(id),
	CONSTRAINT roadmap_items_pillar_id_fkey FOREIGN KEY (pillar_id) REFERENCES public.strategic_pillars(id),
	CONSTRAINT roadmap_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
	CONSTRAINT roadmap_items_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE UNIQUE INDEX idx_roadmap_external_sync ON public.roadmap_items USING btree (product_id, external_system, external_id) WHERE (external_id IS NOT NULL);
CREATE INDEX idx_roadmap_items_created_by ON public.roadmap_items USING btree (created_by);
CREATE INDEX idx_roadmap_items_deleted_at ON public.roadmap_items USING btree (deleted_at);
CREATE INDEX idx_roadmap_owner ON public.roadmap_items USING btree (owner_id);
CREATE INDEX idx_roadmap_path ON public.roadmap_items USING gist (path);
CREATE INDEX idx_roadmap_product ON public.roadmap_items USING btree (product_id);
CREATE INDEX idx_roadmap_search ON public.roadmap_items USING gin (search_vector);
CREATE INDEX idx_roadmap_status ON public.roadmap_items USING btree (status);
CREATE INDEX idx_roadmap_workspace ON public.roadmap_items USING btree (workspace_id);

-- Table Triggers

create trigger trg_roadmap_search before
insert
    or
update
    on
    public.roadmap_items for each row execute function update_search_vector();
create trigger trg_roadmap_items_updated_at before
update
    on
    public.roadmap_items for each row execute function set_updated_at();
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

-- Table Policies

CREATE POLICY roadmap_workspace_isolation ON public.roadmap_items
 AS PERMISSIVE
 FOR ALL
 USING ((workspace_id = current_workspace_id()));

-- Permissions

ALTER TABLE public.roadmap_items OWNER TO postgres;
GRANT ALL ON TABLE public.roadmap_items TO postgres;


-- public.squad_members definição

-- Drop table

-- DROP TABLE public.squad_members;

CREATE TABLE public.squad_members (
	squad_id uuid NOT NULL,
	user_id uuid NOT NULL,
	"role" text NULL,
	joined_at timestamptz DEFAULT now() NOT NULL,
	left_at timestamptz NULL,
	CONSTRAINT squad_members_pkey PRIMARY KEY (squad_id, user_id, joined_at),
	CONSTRAINT squad_members_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE CASCADE,
	CONSTRAINT squad_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.squad_members OWNER TO postgres;
GRANT ALL ON TABLE public.squad_members TO postgres;


-- public.engineering_handoffs definição

-- Drop table

-- DROP TABLE public.engineering_handoffs;

CREATE TABLE public.engineering_handoffs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	roadmap_item_id uuid NOT NULL,
	external_provider text NULL,
	external_project text NULL,
	external_ticket_id text NULL,
	external_ticket_url text NULL,
	engineering_owner text NULL,
	handoff_notes text NULL,
	approved_for_delivery bool DEFAULT false NULL,
	synced_at timestamptz NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT engineering_handoffs_pkey PRIMARY KEY (id),
	CONSTRAINT engineering_handoffs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT engineering_handoffs_roadmap_item_id_fkey FOREIGN KEY (roadmap_item_id) REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
	CONSTRAINT engineering_handoffs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.engineering_handoffs OWNER TO postgres;
GRANT ALL ON TABLE public.engineering_handoffs TO postgres;


-- public.experiments definição

-- Drop table

-- DROP TABLE public.experiments;

CREATE TABLE public.experiments (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	hypothesis_id uuid NOT NULL,
	title text NOT NULL,
	"method" text NULL,
	success_criteria text NOT NULL,
	status public."experiment_status" DEFAULT 'planned'::experiment_status NULL,
	"result" public."experiment_result" NULL,
	learnings text NULL,
	owner_id uuid NULL,
	started_at timestamptz NULL,
	finished_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT experiments_pkey PRIMARY KEY (id),
	CONSTRAINT experiments_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES public.hypotheses(id),
	CONSTRAINT experiments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
	CONSTRAINT experiments_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_experiments_hypothesis ON public.experiments USING btree (hypothesis_id);

-- Table Triggers

create trigger trg_experiments_updated_at before
update
    on
    public.experiments for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.experiments OWNER TO postgres;
GRANT ALL ON TABLE public.experiments TO postgres;


-- public.hypothesis_roadmap_links definição

-- Drop table

-- DROP TABLE public.hypothesis_roadmap_links;

CREATE TABLE public.hypothesis_roadmap_links (
	hypothesis_id uuid NOT NULL,
	roadmap_item_id uuid NOT NULL,
	CONSTRAINT hypothesis_roadmap_links_pkey PRIMARY KEY (hypothesis_id, roadmap_item_id),
	CONSTRAINT hypothesis_roadmap_links_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES public.hypotheses(id) ON DELETE CASCADE,
	CONSTRAINT hypothesis_roadmap_links_roadmap_item_id_fkey FOREIGN KEY (roadmap_item_id) REFERENCES public.roadmap_items(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.hypothesis_roadmap_links OWNER TO postgres;
GRANT ALL ON TABLE public.hypothesis_roadmap_links TO postgres;


-- public.insight_personas definição

-- Drop table

-- DROP TABLE public.insight_personas;

CREATE TABLE public.insight_personas (
	insight_id uuid NOT NULL,
	persona_id uuid NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT insight_personas_pkey PRIMARY KEY (insight_id, persona_id),
	CONSTRAINT insight_personas_insight_id_fkey FOREIGN KEY (insight_id) REFERENCES public.insights(id) ON DELETE CASCADE,
	CONSTRAINT insight_personas_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.insight_personas OWNER TO postgres;
GRANT ALL ON TABLE public.insight_personas TO postgres;


-- public.key_results definição

-- Drop table

-- DROP TABLE public.key_results;

CREATE TABLE public.key_results (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	objective_id uuid NOT NULL,
	title text NOT NULL,
	baseline numeric NULL,
	"target" numeric NULL,
	current_value numeric NULL,
	unit text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT key_results_pkey PRIMARY KEY (id),
	CONSTRAINT key_results_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.objectives(id),
	CONSTRAINT key_results_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.key_results OWNER TO postgres;
GRANT ALL ON TABLE public.key_results TO postgres;


-- public.metric_history definição

-- Drop table

-- DROP TABLE public.metric_history;

CREATE TABLE public.metric_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	metric_id uuid NOT NULL,
	previous_value numeric NULL,
	current_value numeric NULL,
	measured_at timestamptz DEFAULT now() NULL,
	measured_by uuid NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT metric_history_pkey PRIMARY KEY (id),
	CONSTRAINT metric_history_measured_by_fkey FOREIGN KEY (measured_by) REFERENCES public.users(id),
	CONSTRAINT metric_history_metric_id_fkey FOREIGN KEY (metric_id) REFERENCES public.product_metrics(id) ON DELETE CASCADE
);
CREATE INDEX idx_metric_history_measured_at ON public.metric_history USING btree (measured_at DESC);

-- Permissions

ALTER TABLE public.metric_history OWNER TO postgres;
GRANT ALL ON TABLE public.metric_history TO postgres;


-- public.outcomes definição

-- Drop table

-- DROP TABLE public.outcomes;

CREATE TABLE public.outcomes (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	roadmap_item_id uuid NOT NULL,
	key_result_id uuid NULL,
	pain_id uuid NULL,
	hypothesized_impact text NOT NULL,
	status public."outcome_status" DEFAULT 'hypothesized'::outcome_status NULL,
	baseline_value numeric NULL,
	final_value numeric NULL,
	conclusion text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	baseline_snapshot jsonb NULL,
	metrics_snapshot jsonb NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT outcomes_pkey PRIMARY KEY (id),
	CONSTRAINT outcomes_key_result_id_fkey FOREIGN KEY (key_result_id) REFERENCES public.key_results(id),
	CONSTRAINT outcomes_pain_id_fkey FOREIGN KEY (pain_id) REFERENCES public.pains(id),
	CONSTRAINT outcomes_roadmap_item_id_fkey FOREIGN KEY (roadmap_item_id) REFERENCES public.roadmap_items(id),
	CONSTRAINT outcomes_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);
CREATE INDEX idx_outcomes_deleted_at ON public.outcomes USING btree (deleted_at);

-- Table Triggers

create trigger trg_outcomes_updated_at before
update
    on
    public.outcomes for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.outcomes OWNER TO postgres;
GRANT ALL ON TABLE public.outcomes TO postgres;


-- public.pain_hypothesis_links definição

-- Drop table

-- DROP TABLE public.pain_hypothesis_links;

CREATE TABLE public.pain_hypothesis_links (
	pain_id uuid NOT NULL,
	hypothesis_id uuid NOT NULL,
	CONSTRAINT pain_hypothesis_links_pkey PRIMARY KEY (pain_id, hypothesis_id),
	CONSTRAINT pain_hypothesis_links_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES public.hypotheses(id) ON DELETE CASCADE,
	CONSTRAINT pain_hypothesis_links_pain_id_fkey FOREIGN KEY (pain_id) REFERENCES public.pains(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.pain_hypothesis_links OWNER TO postgres;
GRANT ALL ON TABLE public.pain_hypothesis_links TO postgres;


-- public.pain_personas definição

-- Drop table

-- DROP TABLE public.pain_personas;

CREATE TABLE public.pain_personas (
	pain_id uuid NOT NULL,
	persona_id uuid NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT pain_personas_pkey PRIMARY KEY (pain_id, persona_id),
	CONSTRAINT pain_personas_pain_id_fkey FOREIGN KEY (pain_id) REFERENCES public.pains(id) ON DELETE CASCADE,
	CONSTRAINT pain_personas_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.pain_personas OWNER TO postgres;
GRANT ALL ON TABLE public.pain_personas TO postgres;


-- public.pain_relationships definição

-- Drop table

-- DROP TABLE public.pain_relationships;

CREATE TABLE public.pain_relationships (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	source_pain_id uuid NOT NULL,
	target_pain_id uuid NOT NULL,
	"relationship_type" public."relationship_type" NOT NULL,
	reason text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT pain_relationships_pkey PRIMARY KEY (id),
	CONSTRAINT pain_relationships_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT pain_relationships_source_pain_id_fkey FOREIGN KEY (source_pain_id) REFERENCES public.pains(id) ON DELETE CASCADE,
	CONSTRAINT pain_relationships_target_pain_id_fkey FOREIGN KEY (target_pain_id) REFERENCES public.pains(id) ON DELETE CASCADE,
	CONSTRAINT pain_relationships_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Permissions

ALTER TABLE public.pain_relationships OWNER TO postgres;
GRANT ALL ON TABLE public.pain_relationships TO postgres;


-- public.prds definição

-- Drop table

-- DROP TABLE public.prds;

CREATE TABLE public.prds (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	workspace_id uuid NOT NULL,
	roadmap_item_id uuid NOT NULL,
	"version" int4 DEFAULT 1 NULL,
	title text NOT NULL,
	"content" text NOT NULL,
	assumptions text NULL,
	business_rules text NULL,
	non_functional_requirements text NULL,
	analytics_requirements text NULL,
	rollout_strategy text NULL,
	rollback_strategy text NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT prds_pkey PRIMARY KEY (id),
	CONSTRAINT prds_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
	CONSTRAINT prds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT prds_roadmap_item_id_fkey FOREIGN KEY (roadmap_item_id) REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
	CONSTRAINT prds_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
);

-- Table Triggers

create trigger trg_prds_updated_at before
update
    on
    public.prds for each row execute function set_updated_at();

-- Permissions

ALTER TABLE public.prds OWNER TO postgres;
GRANT ALL ON TABLE public.prds TO postgres;


-- public.roadmap_key_result_links definição

-- Drop table

-- DROP TABLE public.roadmap_key_result_links;

CREATE TABLE public.roadmap_key_result_links (
	roadmap_item_id uuid NOT NULL,
	key_result_id uuid NOT NULL,
	CONSTRAINT roadmap_key_result_links_pkey PRIMARY KEY (roadmap_item_id, key_result_id),
	CONSTRAINT roadmap_key_result_links_key_result_id_fkey FOREIGN KEY (key_result_id) REFERENCES public.key_results(id) ON DELETE CASCADE,
	CONSTRAINT roadmap_key_result_links_roadmap_item_id_fkey FOREIGN KEY (roadmap_item_id) REFERENCES public.roadmap_items(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.roadmap_key_result_links OWNER TO postgres;
GRANT ALL ON TABLE public.roadmap_key_result_links TO postgres;


-- public.v_activity_feed fonte

CREATE OR REPLACE VIEW public.v_activity_feed
AS SELECT 'event'::text AS source_type,
    entity_events.id,
    entity_events.workspace_id,
    entity_events.entity_type,
    entity_events.entity_id,
    entity_events.event_type AS title,
    entity_events.reason AS description,
    entity_events.actor_id AS user_id,
    entity_events.occurred_at AS created_at
   FROM entity_events
UNION ALL
 SELECT 'comment'::text AS source_type,
    comments.id,
    comments.workspace_id,
    comments.entity_type,
    comments.entity_id,
    'comment_added'::text AS title,
    comments.content AS description,
    comments.created_by AS user_id,
    comments.created_at
   FROM comments
UNION ALL
 SELECT 'decision'::text AS source_type,
    decision_logs.id,
    decision_logs.workspace_id,
    decision_logs.entity_type,
    decision_logs.entity_id,
    decision_logs.decision_type AS title,
    decision_logs.rationale AS description,
    decision_logs.decided_by AS user_id,
    decision_logs.created_at
   FROM decision_logs;

-- Permissions

ALTER TABLE public.v_activity_feed OWNER TO postgres;
GRANT ALL ON TABLE public.v_activity_feed TO postgres;


-- public.v_product_health fonte

CREATE OR REPLACE VIEW public.v_product_health
AS SELECT p.id AS product_id,
    p.name,
    count(DISTINCT pa.id) AS pains,
    count(DISTINCT h.id) AS hypotheses,
    count(DISTINCT ri.id) AS roadmap_items,
    count(DISTINCT o.id) AS outcomes,
    count(DISTINCT e.id) AS evidences,
    count(DISTINCT pr.id) AS prds
   FROM products p
     LEFT JOIN pains pa ON pa.product_id = p.id AND pa.deleted_at IS NULL
     LEFT JOIN hypotheses h ON h.product_id = p.id AND h.deleted_at IS NULL
     LEFT JOIN roadmap_items ri ON ri.product_id = p.id AND ri.deleted_at IS NULL
     LEFT JOIN outcomes o ON o.roadmap_item_id = ri.id AND o.deleted_at IS NULL
     LEFT JOIN evidences e ON e.product_id = p.id AND e.deleted_at IS NULL
     LEFT JOIN prds pr ON pr.roadmap_item_id = ri.id
  WHERE p.deleted_at IS NULL
  GROUP BY p.id, p.name;

-- Permissions

ALTER TABLE public.v_product_health OWNER TO postgres;
GRANT ALL ON TABLE public.v_product_health TO postgres;


-- public.v_roadmap_strategic_coverage fonte

CREATE OR REPLACE VIEW public.v_roadmap_strategic_coverage
AS SELECT ri.id,
    ri.type,
    ri.title,
    ri.status,
    ri.priority_score,
    sp.name AS pillar_name,
    p.name AS product_name,
    u.name AS owner_name,
    ri.external_system,
    ri.external_id
   FROM roadmap_items ri
     LEFT JOIN strategic_pillars sp ON sp.id = ri.pillar_id
     LEFT JOIN products p ON p.id = ri.product_id
     LEFT JOIN users u ON u.id = ri.owner_id;

-- Permissions

ALTER TABLE public.v_roadmap_strategic_coverage OWNER TO postgres;
GRANT ALL ON TABLE public.v_roadmap_strategic_coverage TO postgres;



-- DROP FUNCTION public._lt_q_regex(_ltree, _lquery);

CREATE OR REPLACE FUNCTION public._lt_q_regex(ltree[], lquery[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_lt_q_regex$function$
;

-- Permissions

ALTER FUNCTION public._lt_q_regex(_ltree, _lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public._lt_q_regex(_ltree, _lquery) TO postgres;

-- DROP FUNCTION public._lt_q_rregex(_lquery, _ltree);

CREATE OR REPLACE FUNCTION public._lt_q_rregex(lquery[], ltree[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_lt_q_rregex$function$
;

-- Permissions

ALTER FUNCTION public._lt_q_rregex(_lquery, _ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._lt_q_rregex(_lquery, _ltree) TO postgres;

-- DROP FUNCTION public._ltq_extract_regex(_ltree, lquery);

CREATE OR REPLACE FUNCTION public._ltq_extract_regex(ltree[], lquery)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltq_extract_regex$function$
;

-- Permissions

ALTER FUNCTION public._ltq_extract_regex(_ltree, lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltq_extract_regex(_ltree, lquery) TO postgres;

-- DROP FUNCTION public._ltq_regex(_ltree, lquery);

CREATE OR REPLACE FUNCTION public._ltq_regex(ltree[], lquery)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltq_regex$function$
;

-- Permissions

ALTER FUNCTION public._ltq_regex(_ltree, lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltq_regex(_ltree, lquery) TO postgres;

-- DROP FUNCTION public._ltq_rregex(lquery, _ltree);

CREATE OR REPLACE FUNCTION public._ltq_rregex(lquery, ltree[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltq_rregex$function$
;

-- Permissions

ALTER FUNCTION public._ltq_rregex(lquery, _ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltq_rregex(lquery, _ltree) TO postgres;

-- DROP FUNCTION public._ltree_compress(internal);

CREATE OR REPLACE FUNCTION public._ltree_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_compress$function$
;

-- Permissions

ALTER FUNCTION public._ltree_compress(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_compress(internal) TO postgres;

-- DROP FUNCTION public._ltree_consistent(internal, _ltree, int2, oid, internal);

CREATE OR REPLACE FUNCTION public._ltree_consistent(internal, ltree[], smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_consistent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_consistent(internal, _ltree, int2, oid, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_consistent(internal, _ltree, int2, oid, internal) TO postgres;

-- DROP FUNCTION public._ltree_extract_isparent(_ltree, ltree);

CREATE OR REPLACE FUNCTION public._ltree_extract_isparent(ltree[], ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_extract_isparent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_extract_isparent(_ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_extract_isparent(_ltree, ltree) TO postgres;

-- DROP FUNCTION public._ltree_extract_risparent(_ltree, ltree);

CREATE OR REPLACE FUNCTION public._ltree_extract_risparent(ltree[], ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_extract_risparent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_extract_risparent(_ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_extract_risparent(_ltree, ltree) TO postgres;

-- DROP FUNCTION public._ltree_gist_options(internal);

CREATE OR REPLACE FUNCTION public._ltree_gist_options(internal)
 RETURNS void
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE
AS '$libdir/ltree', $function$_ltree_gist_options$function$
;

-- Permissions

ALTER FUNCTION public._ltree_gist_options(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_gist_options(internal) TO postgres;

-- DROP FUNCTION public._ltree_isparent(_ltree, ltree);

CREATE OR REPLACE FUNCTION public._ltree_isparent(ltree[], ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_isparent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_isparent(_ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_isparent(_ltree, ltree) TO postgres;

-- DROP FUNCTION public._ltree_penalty(internal, internal, internal);

CREATE OR REPLACE FUNCTION public._ltree_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_penalty$function$
;

-- Permissions

ALTER FUNCTION public._ltree_penalty(internal, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_penalty(internal, internal, internal) TO postgres;

-- DROP FUNCTION public._ltree_picksplit(internal, internal);

CREATE OR REPLACE FUNCTION public._ltree_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_picksplit$function$
;

-- Permissions

ALTER FUNCTION public._ltree_picksplit(internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_picksplit(internal, internal) TO postgres;

-- DROP FUNCTION public._ltree_r_isparent(ltree, _ltree);

CREATE OR REPLACE FUNCTION public._ltree_r_isparent(ltree, ltree[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_r_isparent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_r_isparent(ltree, _ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_r_isparent(ltree, _ltree) TO postgres;

-- DROP FUNCTION public._ltree_r_risparent(ltree, _ltree);

CREATE OR REPLACE FUNCTION public._ltree_r_risparent(ltree, ltree[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_r_risparent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_r_risparent(ltree, _ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_r_risparent(ltree, _ltree) TO postgres;

-- DROP FUNCTION public._ltree_risparent(_ltree, ltree);

CREATE OR REPLACE FUNCTION public._ltree_risparent(ltree[], ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_risparent$function$
;

-- Permissions

ALTER FUNCTION public._ltree_risparent(_ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_risparent(_ltree, ltree) TO postgres;

-- DROP FUNCTION public._ltree_same(ltree_gist, ltree_gist, internal);

CREATE OR REPLACE FUNCTION public._ltree_same(ltree_gist, ltree_gist, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_same$function$
;

-- Permissions

ALTER FUNCTION public._ltree_same(ltree_gist, ltree_gist, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_same(ltree_gist, ltree_gist, internal) TO postgres;

-- DROP FUNCTION public._ltree_union(internal, internal);

CREATE OR REPLACE FUNCTION public._ltree_union(internal, internal)
 RETURNS ltree_gist
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltree_union$function$
;

-- Permissions

ALTER FUNCTION public._ltree_union(internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltree_union(internal, internal) TO postgres;

-- DROP FUNCTION public._ltxtq_exec(_ltree, ltxtquery);

CREATE OR REPLACE FUNCTION public._ltxtq_exec(ltree[], ltxtquery)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltxtq_exec$function$
;

-- Permissions

ALTER FUNCTION public._ltxtq_exec(_ltree, ltxtquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltxtq_exec(_ltree, ltxtquery) TO postgres;

-- DROP FUNCTION public._ltxtq_extract_exec(_ltree, ltxtquery);

CREATE OR REPLACE FUNCTION public._ltxtq_extract_exec(ltree[], ltxtquery)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltxtq_extract_exec$function$
;

-- Permissions

ALTER FUNCTION public._ltxtq_extract_exec(_ltree, ltxtquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltxtq_extract_exec(_ltree, ltxtquery) TO postgres;

-- DROP FUNCTION public._ltxtq_rexec(ltxtquery, _ltree);

CREATE OR REPLACE FUNCTION public._ltxtq_rexec(ltxtquery, ltree[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_ltxtq_rexec$function$
;

-- Permissions

ALTER FUNCTION public._ltxtq_rexec(ltxtquery, _ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public._ltxtq_rexec(ltxtquery, _ltree) TO postgres;

-- DROP FUNCTION public.armor(bytea, _text, _text);

CREATE OR REPLACE FUNCTION public.armor(bytea, text[], text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$
;

-- Permissions

ALTER FUNCTION public.armor(bytea, _text, _text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.armor(bytea, _text, _text) TO postgres;

-- DROP FUNCTION public.armor(bytea);

CREATE OR REPLACE FUNCTION public.armor(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$
;

-- Permissions

ALTER FUNCTION public.armor(bytea) OWNER TO postgres;
GRANT ALL ON FUNCTION public.armor(bytea) TO postgres;

-- DROP FUNCTION public.audit_entity_changes();

CREATE OR REPLACE FUNCTION public.audit_entity_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_event_type text;
  v_changed_fields text[];
  v_from_status text;
  v_to_status text;
  v_actor_id uuid;
  v_old_jsonb jsonb;
  v_new_jsonb jsonb;
  v_has_status boolean;
  v_has_deleted_at boolean;
BEGIN
  v_actor_id := current_actor_id();
  
  IF (TG_OP = 'INSERT') THEN
    v_new_jsonb := to_jsonb(NEW);
    v_to_status := v_new_jsonb->>'status';
    
    INSERT INTO entity_events (
      workspace_id, entity_type, entity_id, event_type,
      to_status, payload, actor_id
    ) VALUES (
      NEW.workspace_id, TG_TABLE_NAME, NEW.id, 'created',
      v_to_status, v_new_jsonb, v_actor_id
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old_jsonb := to_jsonb(OLD);
    v_new_jsonb := to_jsonb(NEW);
    
    v_has_deleted_at := v_old_jsonb ? 'deleted_at';
    v_has_status := v_old_jsonb ? 'status';
    
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_jsonb)
    WHERE v_old_jsonb->key IS DISTINCT FROM v_new_jsonb->key
      AND key != 'updated_at';
    
    IF v_changed_fields IS NULL OR array_length(v_changed_fields, 1) = 0 THEN
      RETURN NEW;
    END IF;
    
    IF v_has_deleted_at 
       AND v_old_jsonb->>'deleted_at' IS NULL 
       AND v_new_jsonb->>'deleted_at' IS NOT NULL THEN
      v_event_type := 'soft_deleted';
    ELSIF v_has_deleted_at 
          AND v_old_jsonb->>'deleted_at' IS NOT NULL 
          AND v_new_jsonb->>'deleted_at' IS NULL THEN
      v_event_type := 'restored';
    ELSIF v_has_status
          AND v_old_jsonb->>'status' IS DISTINCT FROM v_new_jsonb->>'status' THEN
      v_event_type := 'status_changed';
      v_from_status := v_old_jsonb->>'status';
      v_to_status := v_new_jsonb->>'status';
    ELSE
      v_event_type := 'updated';
    END IF;
    
    INSERT INTO entity_events (
      workspace_id, entity_type, entity_id, event_type,
      from_status, to_status, changed_fields, payload, actor_id
    ) VALUES (
      NEW.workspace_id, TG_TABLE_NAME, NEW.id, v_event_type,
      v_from_status, v_to_status, v_changed_fields,
      jsonb_build_object('before', v_old_jsonb, 'after', v_new_jsonb),
      v_actor_id
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$
;

COMMENT ON FUNCTION public.audit_entity_changes() IS 'Trigger de auditoria genérico. Pré-requisito: tabela tem coluna workspace_id.
   Detecta colunas status e deleted_at via jsonb. Skip de UPDATEs idempotentes.';

-- Permissions

ALTER FUNCTION public.audit_entity_changes() OWNER TO postgres;
GRANT ALL ON FUNCTION public.audit_entity_changes() TO postgres;

-- DROP FUNCTION public."citext"(bool);

CREATE OR REPLACE FUNCTION public.citext(boolean)
 RETURNS citext
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$booltext$function$
;

-- Permissions

ALTER FUNCTION public."citext"(bool) OWNER TO postgres;
GRANT ALL ON FUNCTION public."citext"(bool) TO postgres;

-- DROP FUNCTION public."citext"(inet);

CREATE OR REPLACE FUNCTION public.citext(inet)
 RETURNS citext
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$network_show$function$
;

-- Permissions

ALTER FUNCTION public."citext"(inet) OWNER TO postgres;
GRANT ALL ON FUNCTION public."citext"(inet) TO postgres;

-- DROP FUNCTION public."citext"(bpchar);

CREATE OR REPLACE FUNCTION public.citext(character)
 RETURNS citext
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$rtrim1$function$
;

-- Permissions

ALTER FUNCTION public."citext"(bpchar) OWNER TO postgres;
GRANT ALL ON FUNCTION public."citext"(bpchar) TO postgres;

-- DROP FUNCTION public.citext_cmp(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_cmp(citext, citext)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_cmp$function$
;

-- Permissions

ALTER FUNCTION public.citext_cmp(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_cmp(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_eq(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_eq(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_eq$function$
;

-- Permissions

ALTER FUNCTION public.citext_eq(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_eq(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_ge(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_ge(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_ge$function$
;

-- Permissions

ALTER FUNCTION public.citext_ge(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_ge(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_gt(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_gt(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_gt$function$
;

-- Permissions

ALTER FUNCTION public.citext_gt(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_gt(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_hash(citext);

CREATE OR REPLACE FUNCTION public.citext_hash(citext)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_hash$function$
;

-- Permissions

ALTER FUNCTION public.citext_hash(citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_hash(citext) TO postgres;

-- DROP FUNCTION public.citext_hash_extended(citext, int8);

CREATE OR REPLACE FUNCTION public.citext_hash_extended(citext, bigint)
 RETURNS bigint
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_hash_extended$function$
;

-- Permissions

ALTER FUNCTION public.citext_hash_extended(citext, int8) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_hash_extended(citext, int8) TO postgres;

-- DROP FUNCTION public.citext_larger(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_larger(citext, citext)
 RETURNS citext
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_larger$function$
;

-- Permissions

ALTER FUNCTION public.citext_larger(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_larger(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_le(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_le(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_le$function$
;

-- Permissions

ALTER FUNCTION public.citext_le(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_le(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_lt(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_lt(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_lt$function$
;

-- Permissions

ALTER FUNCTION public.citext_lt(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_lt(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_ne(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_ne(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_ne$function$
;

-- Permissions

ALTER FUNCTION public.citext_ne(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_ne(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_pattern_cmp(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_pattern_cmp(citext, citext)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_pattern_cmp$function$
;

-- Permissions

ALTER FUNCTION public.citext_pattern_cmp(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_pattern_cmp(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_pattern_ge(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_pattern_ge(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_pattern_ge$function$
;

-- Permissions

ALTER FUNCTION public.citext_pattern_ge(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_pattern_ge(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_pattern_gt(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_pattern_gt(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_pattern_gt$function$
;

-- Permissions

ALTER FUNCTION public.citext_pattern_gt(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_pattern_gt(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_pattern_le(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_pattern_le(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_pattern_le$function$
;

-- Permissions

ALTER FUNCTION public.citext_pattern_le(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_pattern_le(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_pattern_lt(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_pattern_lt(citext, citext)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_pattern_lt$function$
;

-- Permissions

ALTER FUNCTION public.citext_pattern_lt(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_pattern_lt(citext, citext) TO postgres;

-- DROP FUNCTION public.citext_smaller(citext, citext);

CREATE OR REPLACE FUNCTION public.citext_smaller(citext, citext)
 RETURNS citext
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/citext', $function$citext_smaller$function$
;

-- Permissions

ALTER FUNCTION public.citext_smaller(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citext_smaller(citext, citext) TO postgres;

-- DROP FUNCTION public.citextin(cstring);

CREATE OR REPLACE FUNCTION public.citextin(cstring)
 RETURNS citext
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$textin$function$
;

-- Permissions

ALTER FUNCTION public.citextin(cstring) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citextin(cstring) TO postgres;

-- DROP FUNCTION public.citextout(citext);

CREATE OR REPLACE FUNCTION public.citextout(citext)
 RETURNS cstring
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$textout$function$
;

-- Permissions

ALTER FUNCTION public.citextout(citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citextout(citext) TO postgres;

-- DROP FUNCTION public.citextrecv(internal);

CREATE OR REPLACE FUNCTION public.citextrecv(internal)
 RETURNS citext
 LANGUAGE internal
 STABLE PARALLEL SAFE STRICT
AS $function$textrecv$function$
;

-- Permissions

ALTER FUNCTION public.citextrecv(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citextrecv(internal) TO postgres;

-- DROP FUNCTION public.citextsend(citext);

CREATE OR REPLACE FUNCTION public.citextsend(citext)
 RETURNS bytea
 LANGUAGE internal
 STABLE PARALLEL SAFE STRICT
AS $function$textsend$function$
;

-- Permissions

ALTER FUNCTION public.citextsend(citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.citextsend(citext) TO postgres;

-- DROP FUNCTION public.crypt(text, text);

CREATE OR REPLACE FUNCTION public.crypt(text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_crypt$function$
;

-- Permissions

ALTER FUNCTION public.crypt(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.crypt(text, text) TO postgres;

-- DROP FUNCTION public.current_actor_id();

CREATE OR REPLACE FUNCTION public.current_actor_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT NULLIF(current_setting('app.current_actor', true), '')::uuid;
$function$
;

-- Permissions

ALTER FUNCTION public.current_actor_id() OWNER TO postgres;
GRANT ALL ON FUNCTION public.current_actor_id() TO postgres;

-- DROP FUNCTION public.current_workspace_id();

CREATE OR REPLACE FUNCTION public.current_workspace_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN current_setting('app.current_workspace_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.current_workspace_id() OWNER TO postgres;
GRANT ALL ON FUNCTION public.current_workspace_id() TO postgres;

-- DROP FUNCTION public.dearmor(text);

CREATE OR REPLACE FUNCTION public.dearmor(text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_dearmor$function$
;

-- Permissions

ALTER FUNCTION public.dearmor(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.dearmor(text) TO postgres;

-- DROP FUNCTION public.decrypt(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.decrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt$function$
;

-- Permissions

ALTER FUNCTION public.decrypt(bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.decrypt(bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.decrypt_iv(bytea, bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.decrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$
;

-- Permissions

ALTER FUNCTION public.decrypt_iv(bytea, bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.decrypt_iv(bytea, bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.digest(bytea, text);

CREATE OR REPLACE FUNCTION public.digest(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$
;

-- Permissions

ALTER FUNCTION public.digest(bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.digest(bytea, text) TO postgres;

-- DROP FUNCTION public.digest(text, text);

CREATE OR REPLACE FUNCTION public.digest(text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$
;

-- Permissions

ALTER FUNCTION public.digest(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.digest(text, text) TO postgres;

-- DROP FUNCTION public.encrypt(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.encrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt$function$
;

-- Permissions

ALTER FUNCTION public.encrypt(bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.encrypt(bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.encrypt_iv(bytea, bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.encrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$
;

-- Permissions

ALTER FUNCTION public.encrypt_iv(bytea, bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.encrypt_iv(bytea, bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.ensure_entity_events_partition(int4);

CREATE OR REPLACE FUNCTION public.ensure_entity_events_partition(target_year integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  partition_name text;
  start_ts       text;
  end_ts         text;
BEGIN
  partition_name := format('entity_events_%s', target_year);
  start_ts       := format('%s-01-01 00:00:00-03', target_year);
  end_ts         := format('%s-01-01 00:00:00-03', target_year + 1);

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.entity_events FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_ts, end_ts
  );
END;
$function$
;

COMMENT ON FUNCTION public.ensure_entity_events_partition(int4) IS 'Cria partição anual de entity_events. Agendar SELECT public.ensure_entity_events_partition(EXTRACT(YEAR FROM now())::int + 1) anualmente.';

-- Permissions

ALTER FUNCTION public.ensure_entity_events_partition(int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ensure_entity_events_partition(int4) TO postgres;

-- DROP FUNCTION public.fips_mode();

CREATE OR REPLACE FUNCTION public.fips_mode()
 RETURNS boolean
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_check_fipsmode$function$
;

-- Permissions

ALTER FUNCTION public.fips_mode() OWNER TO postgres;
GRANT ALL ON FUNCTION public.fips_mode() TO postgres;

-- DROP FUNCTION public.gen_random_bytes(int4);

CREATE OR REPLACE FUNCTION public.gen_random_bytes(integer)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_random_bytes$function$
;

-- Permissions

ALTER FUNCTION public.gen_random_bytes(int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gen_random_bytes(int4) TO postgres;

-- DROP FUNCTION public.gen_random_uuid();

CREATE OR REPLACE FUNCTION public.gen_random_uuid()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/pgcrypto', $function$pg_random_uuid$function$
;

-- Permissions

ALTER FUNCTION public.gen_random_uuid() OWNER TO postgres;
GRANT ALL ON FUNCTION public.gen_random_uuid() TO postgres;

-- DROP FUNCTION public.gen_salt(text, int4);

CREATE OR REPLACE FUNCTION public.gen_salt(text, integer)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$
;

-- Permissions

ALTER FUNCTION public.gen_salt(text, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gen_salt(text, int4) TO postgres;

-- DROP FUNCTION public.gen_salt(text);

CREATE OR REPLACE FUNCTION public.gen_salt(text)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt$function$
;

-- Permissions

ALTER FUNCTION public.gen_salt(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gen_salt(text) TO postgres;

-- DROP FUNCTION public.gin_btree_consistent(internal, int2, anyelement, int4, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_btree_consistent(internal, smallint, anyelement, integer, internal, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_btree_consistent$function$
;

-- Permissions

ALTER FUNCTION public.gin_btree_consistent(internal, int2, anyelement, int4, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_btree_consistent(internal, int2, anyelement, int4, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_anyenum(anyenum, anyenum, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_anyenum(anyenum, anyenum, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_anyenum$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_anyenum(anyenum, anyenum, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_anyenum(anyenum, anyenum, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_bit(bit, bit, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_bit(bit, bit, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_bit$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_bit(bit, bit, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_bit(bit, bit, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_bool(bool, bool, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_bool(boolean, boolean, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_bool$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_bool(bool, bool, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_bool(bool, bool, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_bpchar(bpchar, bpchar, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_bpchar(character, character, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_bpchar$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_bpchar(bpchar, bpchar, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_bpchar(bpchar, bpchar, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_bytea(bytea, bytea, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_bytea(bytea, bytea, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_bytea$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_bytea(bytea, bytea, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_bytea(bytea, bytea, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_char(char, char, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_char("char", "char", smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_char$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_char(char, char, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_char(char, char, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_cidr(cidr, cidr, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_cidr(cidr, cidr, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_cidr$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_cidr(cidr, cidr, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_cidr(cidr, cidr, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_date(date, date, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_date(date, date, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_date$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_date(date, date, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_date(date, date, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_float4(float4, float4, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_float4(real, real, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_float4$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_float4(float4, float4, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_float4(float4, float4, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_float8(float8, float8, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_float8(double precision, double precision, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_float8$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_float8(float8, float8, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_float8(float8, float8, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_inet(inet, inet, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_inet(inet, inet, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_inet$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_inet(inet, inet, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_inet(inet, inet, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_int2(int2, int2, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_int2(smallint, smallint, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_int2$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_int2(int2, int2, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_int2(int2, int2, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_int4(int4, int4, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_int4(integer, integer, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_int4$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_int4(int4, int4, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_int4(int4, int4, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_int8(int8, int8, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_int8(bigint, bigint, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_int8$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_int8(int8, int8, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_int8(int8, int8, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_interval(interval, interval, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_interval(interval, interval, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_interval$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_interval(interval, interval, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_interval(interval, interval, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_macaddr(macaddr, macaddr, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_macaddr(macaddr, macaddr, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_macaddr$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_macaddr(macaddr, macaddr, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_macaddr(macaddr, macaddr, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_macaddr8(macaddr8, macaddr8, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_macaddr8(macaddr8, macaddr8, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_macaddr8$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_macaddr8(macaddr8, macaddr8, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_macaddr8(macaddr8, macaddr8, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_money(money, money, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_money(money, money, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_money$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_money(money, money, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_money(money, money, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_name(name, name, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_name(name, name, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_name$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_name(name, name, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_name(name, name, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_numeric(numeric, numeric, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_numeric(numeric, numeric, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_numeric$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_numeric(numeric, numeric, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_numeric(numeric, numeric, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_oid(oid, oid, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_oid(oid, oid, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_oid$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_oid(oid, oid, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_oid(oid, oid, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_text(text, text, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_text(text, text, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_text$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_text(text, text, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_text(text, text, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_time(time, time, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_time(time without time zone, time without time zone, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_time$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_time(time, time, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_time(time, time, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_timestamp(timestamp, timestamp, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_timestamp(timestamp without time zone, timestamp without time zone, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_timestamp$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_timestamp(timestamp, timestamp, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_timestamp(timestamp, timestamp, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_timestamptz(timestamptz, timestamptz, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_timestamptz(timestamp with time zone, timestamp with time zone, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_timestamptz$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_timestamptz(timestamptz, timestamptz, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_timestamptz(timestamptz, timestamptz, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_timetz(timetz, timetz, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_timetz(time with time zone, time with time zone, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_timetz$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_timetz(timetz, timetz, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_timetz(timetz, timetz, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_uuid(uuid, uuid, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_uuid(uuid, uuid, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_uuid$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_uuid(uuid, uuid, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_uuid(uuid, uuid, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_compare_prefix_varbit(varbit, varbit, int2, internal);

CREATE OR REPLACE FUNCTION public.gin_compare_prefix_varbit(bit varying, bit varying, smallint, internal)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_compare_prefix_varbit$function$
;

-- Permissions

ALTER FUNCTION public.gin_compare_prefix_varbit(varbit, varbit, int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_compare_prefix_varbit(varbit, varbit, int2, internal) TO postgres;

-- DROP FUNCTION public.gin_enum_cmp(anyenum, anyenum);

CREATE OR REPLACE FUNCTION public.gin_enum_cmp(anyenum, anyenum)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_enum_cmp$function$
;

-- Permissions

ALTER FUNCTION public.gin_enum_cmp(anyenum, anyenum) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_enum_cmp(anyenum, anyenum) TO postgres;

-- DROP FUNCTION public.gin_extract_query_anyenum(anyenum, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_anyenum(anyenum, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_anyenum$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_anyenum(anyenum, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_anyenum(anyenum, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_bit(bit, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_bit(bit, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_bit$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_bit(bit, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_bit(bit, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_bool(bool, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_bool(boolean, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_bool$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_bool(bool, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_bool(bool, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_bpchar(bpchar, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_bpchar(character, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_bpchar$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_bpchar(bpchar, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_bpchar(bpchar, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_bytea(bytea, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_bytea(bytea, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_bytea$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_bytea(bytea, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_bytea(bytea, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_char(char, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_char("char", internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_char$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_char(char, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_char(char, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_cidr(cidr, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_cidr(cidr, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_cidr$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_cidr(cidr, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_cidr(cidr, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_date(date, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_date(date, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_date$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_date(date, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_date(date, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_float4(float4, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_float4(real, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_float4$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_float4(float4, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_float4(float4, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_float8(float8, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_float8(double precision, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_float8$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_float8(float8, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_float8(float8, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_inet(inet, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_inet(inet, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_inet$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_inet(inet, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_inet(inet, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_int2(int2, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_int2(smallint, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_int2$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_int2(int2, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_int2(int2, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_int4(int4, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_int4(integer, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_int4$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_int4(int4, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_int4(int4, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_int8(int8, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_int8(bigint, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_int8$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_int8(int8, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_int8(int8, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_interval(interval, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_interval(interval, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_interval$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_interval(interval, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_interval(interval, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_macaddr(macaddr, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_macaddr(macaddr, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_macaddr$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_macaddr(macaddr, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_macaddr(macaddr, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_macaddr8(macaddr8, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_macaddr8(macaddr8, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_macaddr8$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_macaddr8(macaddr8, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_macaddr8(macaddr8, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_money(money, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_money(money, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_money$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_money(money, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_money(money, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_name(name, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_name(name, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_name$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_name(name, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_name(name, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_numeric(numeric, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_numeric(numeric, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_numeric$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_numeric(numeric, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_numeric(numeric, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_oid(oid, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_oid(oid, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_oid$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_oid(oid, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_oid(oid, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_text(text, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_text(text, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_text$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_text(text, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_text(text, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_time(time, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_time(time without time zone, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_time$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_time(time, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_time(time, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_timestamp(timestamp, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_timestamp(timestamp without time zone, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_timestamp$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_timestamp(timestamp, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_timestamp(timestamp, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_timestamptz(timestamptz, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_timestamptz(timestamp with time zone, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_timestamptz$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_timestamptz(timestamptz, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_timestamptz(timestamptz, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_timetz(timetz, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_timetz(time with time zone, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_timetz$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_timetz(timetz, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_timetz(timetz, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_uuid(uuid, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_uuid(uuid, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_uuid$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_uuid(uuid, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_uuid(uuid, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_query_varbit(varbit, internal, int2, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_varbit(bit varying, internal, smallint, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_query_varbit$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_varbit(varbit, internal, int2, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_varbit(varbit, internal, int2, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_anyenum(anyenum, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_anyenum(anyenum, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_anyenum$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_anyenum(anyenum, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_anyenum(anyenum, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_bit(bit, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_bit(bit, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_bit$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_bit(bit, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_bit(bit, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_bool(bool, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_bool(boolean, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_bool$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_bool(bool, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_bool(bool, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_bpchar(bpchar, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_bpchar(character, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_bpchar$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_bpchar(bpchar, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_bpchar(bpchar, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_bytea(bytea, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_bytea(bytea, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_bytea$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_bytea(bytea, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_bytea(bytea, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_char(char, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_char("char", internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_char$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_char(char, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_char(char, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_cidr(cidr, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_cidr(cidr, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_cidr$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_cidr(cidr, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_cidr(cidr, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_date(date, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_date(date, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_date$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_date(date, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_date(date, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_float4(float4, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_float4(real, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_float4$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_float4(float4, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_float4(float4, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_float8(float8, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_float8(double precision, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_float8$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_float8(float8, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_float8(float8, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_inet(inet, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_inet(inet, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_inet$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_inet(inet, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_inet(inet, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_int2(int2, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_int2(smallint, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_int2$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_int2(int2, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_int2(int2, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_int4(int4, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_int4(integer, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_int4$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_int4(int4, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_int4(int4, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_int8(int8, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_int8(bigint, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_int8$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_int8(int8, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_int8(int8, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_interval(interval, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_interval(interval, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_interval$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_interval(interval, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_interval(interval, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_macaddr(macaddr, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_macaddr(macaddr, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_macaddr$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_macaddr(macaddr, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_macaddr(macaddr, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_macaddr8(macaddr8, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_macaddr8(macaddr8, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_macaddr8$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_macaddr8(macaddr8, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_macaddr8(macaddr8, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_money(money, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_money(money, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_money$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_money(money, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_money(money, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_name(name, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_name(name, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_name$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_name(name, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_name(name, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_numeric(numeric, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_numeric(numeric, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_numeric$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_numeric(numeric, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_numeric(numeric, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_oid(oid, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_oid(oid, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_oid$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_oid(oid, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_oid(oid, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_text(text, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_text(text, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_text$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_text(text, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_text(text, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_time(time, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_time(time without time zone, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_time$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_time(time, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_time(time, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_timestamp(timestamp, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_timestamp(timestamp without time zone, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_timestamp$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_timestamp(timestamp, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_timestamp(timestamp, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_timestamptz(timestamptz, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_timestamptz(timestamp with time zone, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_timestamptz$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_timestamptz(timestamptz, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_timestamptz(timestamptz, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_timetz(timetz, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_timetz(time with time zone, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_timetz$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_timetz(timetz, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_timetz(timetz, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_trgm(text, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_trgm(text, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_uuid(uuid, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_uuid(uuid, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_uuid$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_uuid(uuid, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_uuid(uuid, internal) TO postgres;

-- DROP FUNCTION public.gin_extract_value_varbit(varbit, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_varbit(bit varying, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_extract_value_varbit$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_varbit(varbit, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_varbit(varbit, internal) TO postgres;

-- DROP FUNCTION public.gin_numeric_cmp(numeric, numeric);

CREATE OR REPLACE FUNCTION public.gin_numeric_cmp(numeric, numeric)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE STRICT
AS '$libdir/btree_gin', $function$gin_numeric_cmp$function$
;

-- Permissions

ALTER FUNCTION public.gin_numeric_cmp(numeric, numeric) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_numeric_cmp(numeric, numeric) TO postgres;

-- DROP FUNCTION public.gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_consistent$function$
;

-- Permissions

ALTER FUNCTION public.gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal) TO postgres;

-- DROP FUNCTION public.gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)
 RETURNS "char"
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_triconsistent$function$
;

-- Permissions

ALTER FUNCTION public.gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal) TO postgres;

-- DROP FUNCTION public.gtrgm_compress(internal);

CREATE OR REPLACE FUNCTION public.gtrgm_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_compress$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_compress(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO postgres;

-- DROP FUNCTION public.gtrgm_consistent(internal, text, int2, oid, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_consistent$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_consistent(internal, text, int2, oid, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, int2, oid, internal) TO postgres;

-- DROP FUNCTION public.gtrgm_decompress(internal);

CREATE OR REPLACE FUNCTION public.gtrgm_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_decompress$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_decompress(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO postgres;

-- DROP FUNCTION public.gtrgm_distance(internal, text, int2, oid, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_distance$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_distance(internal, text, int2, oid, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, int2, oid, internal) TO postgres;

-- DROP FUNCTION public.gtrgm_in(cstring);

CREATE OR REPLACE FUNCTION public.gtrgm_in(cstring)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_in$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_in(cstring) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO postgres;

-- DROP FUNCTION public.gtrgm_options(internal);

CREATE OR REPLACE FUNCTION public.gtrgm_options(internal)
 RETURNS void
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE
AS '$libdir/pg_trgm', $function$gtrgm_options$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_options(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO postgres;

-- DROP FUNCTION public.gtrgm_out(gtrgm);

CREATE OR REPLACE FUNCTION public.gtrgm_out(gtrgm)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_out$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_out(gtrgm) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_out(gtrgm) TO postgres;

-- DROP FUNCTION public.gtrgm_penalty(internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_penalty$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_penalty(internal, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO postgres;

-- DROP FUNCTION public.gtrgm_picksplit(internal, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_picksplit$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_picksplit(internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO postgres;

-- DROP FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_same$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal) TO postgres;

-- DROP FUNCTION public.gtrgm_union(internal, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_union(internal, internal)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_union$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_union(internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO postgres;

-- DROP FUNCTION public.hash_ltree(ltree);

CREATE OR REPLACE FUNCTION public.hash_ltree(ltree)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$hash_ltree$function$
;

-- Permissions

ALTER FUNCTION public.hash_ltree(ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.hash_ltree(ltree) TO postgres;

-- DROP FUNCTION public.hash_ltree_extended(ltree, int8);

CREATE OR REPLACE FUNCTION public.hash_ltree_extended(ltree, bigint)
 RETURNS bigint
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$hash_ltree_extended$function$
;

-- Permissions

ALTER FUNCTION public.hash_ltree_extended(ltree, int8) OWNER TO postgres;
GRANT ALL ON FUNCTION public.hash_ltree_extended(ltree, int8) TO postgres;

-- DROP FUNCTION public.hmac(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.hmac(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$
;

-- Permissions

ALTER FUNCTION public.hmac(bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.hmac(bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.hmac(text, text, text);

CREATE OR REPLACE FUNCTION public.hmac(text, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$
;

-- Permissions

ALTER FUNCTION public.hmac(text, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.hmac(text, text, text) TO postgres;

-- DROP FUNCTION public."index"(ltree, ltree, int4);

CREATE OR REPLACE FUNCTION public.index(ltree, ltree, integer)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_index$function$
;

-- Permissions

ALTER FUNCTION public."index"(ltree, ltree, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public."index"(ltree, ltree, int4) TO postgres;

-- DROP FUNCTION public."index"(ltree, ltree);

CREATE OR REPLACE FUNCTION public.index(ltree, ltree)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_index$function$
;

-- Permissions

ALTER FUNCTION public."index"(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public."index"(ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(_ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree[])
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$_lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(_ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(_ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree, ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree, ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree, ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree, ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree, ltree) TO postgres;

-- DROP FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree);

CREATE OR REPLACE FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lca$function$
;

-- Permissions

ALTER FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lca(ltree, ltree, ltree, ltree, ltree) TO postgres;

-- DROP FUNCTION public.lquery_in(cstring);

CREATE OR REPLACE FUNCTION public.lquery_in(cstring)
 RETURNS lquery
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lquery_in$function$
;

-- Permissions

ALTER FUNCTION public.lquery_in(cstring) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lquery_in(cstring) TO postgres;

-- DROP FUNCTION public.lquery_out(lquery);

CREATE OR REPLACE FUNCTION public.lquery_out(lquery)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lquery_out$function$
;

-- Permissions

ALTER FUNCTION public.lquery_out(lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lquery_out(lquery) TO postgres;

-- DROP FUNCTION public.lquery_recv(internal);

CREATE OR REPLACE FUNCTION public.lquery_recv(internal)
 RETURNS lquery
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lquery_recv$function$
;

-- Permissions

ALTER FUNCTION public.lquery_recv(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lquery_recv(internal) TO postgres;

-- DROP FUNCTION public.lquery_send(lquery);

CREATE OR REPLACE FUNCTION public.lquery_send(lquery)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lquery_send$function$
;

-- Permissions

ALTER FUNCTION public.lquery_send(lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lquery_send(lquery) TO postgres;

-- DROP FUNCTION public.lt_q_regex(ltree, _lquery);

CREATE OR REPLACE FUNCTION public.lt_q_regex(ltree, lquery[])
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lt_q_regex$function$
;

-- Permissions

ALTER FUNCTION public.lt_q_regex(ltree, _lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lt_q_regex(ltree, _lquery) TO postgres;

-- DROP FUNCTION public.lt_q_rregex(_lquery, ltree);

CREATE OR REPLACE FUNCTION public.lt_q_rregex(lquery[], ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$lt_q_rregex$function$
;

-- Permissions

ALTER FUNCTION public.lt_q_rregex(_lquery, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.lt_q_rregex(_lquery, ltree) TO postgres;

-- DROP FUNCTION public.ltq_regex(ltree, lquery);

CREATE OR REPLACE FUNCTION public.ltq_regex(ltree, lquery)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltq_regex$function$
;

-- Permissions

ALTER FUNCTION public.ltq_regex(ltree, lquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltq_regex(ltree, lquery) TO postgres;

-- DROP FUNCTION public.ltq_rregex(lquery, ltree);

CREATE OR REPLACE FUNCTION public.ltq_rregex(lquery, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltq_rregex$function$
;

-- Permissions

ALTER FUNCTION public.ltq_rregex(lquery, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltq_rregex(lquery, ltree) TO postgres;

-- DROP FUNCTION public.ltree2text(ltree);

CREATE OR REPLACE FUNCTION public.ltree2text(ltree)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree2text$function$
;

-- Permissions

ALTER FUNCTION public.ltree2text(ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree2text(ltree) TO postgres;

-- DROP FUNCTION public.ltree_addltree(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_addltree(ltree, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_addltree$function$
;

-- Permissions

ALTER FUNCTION public.ltree_addltree(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_addltree(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_addtext(ltree, text);

CREATE OR REPLACE FUNCTION public.ltree_addtext(ltree, text)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_addtext$function$
;

-- Permissions

ALTER FUNCTION public.ltree_addtext(ltree, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_addtext(ltree, text) TO postgres;

-- DROP FUNCTION public.ltree_cmp(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_cmp(ltree, ltree)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_cmp$function$
;

-- Permissions

ALTER FUNCTION public.ltree_cmp(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_cmp(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_compress(internal);

CREATE OR REPLACE FUNCTION public.ltree_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_compress$function$
;

-- Permissions

ALTER FUNCTION public.ltree_compress(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_compress(internal) TO postgres;

-- DROP FUNCTION public.ltree_consistent(internal, ltree, int2, oid, internal);

CREATE OR REPLACE FUNCTION public.ltree_consistent(internal, ltree, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_consistent$function$
;

-- Permissions

ALTER FUNCTION public.ltree_consistent(internal, ltree, int2, oid, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_consistent(internal, ltree, int2, oid, internal) TO postgres;

-- DROP FUNCTION public.ltree_decompress(internal);

CREATE OR REPLACE FUNCTION public.ltree_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_decompress$function$
;

-- Permissions

ALTER FUNCTION public.ltree_decompress(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_decompress(internal) TO postgres;

-- DROP FUNCTION public.ltree_eq(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_eq(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_eq$function$
;

-- Permissions

ALTER FUNCTION public.ltree_eq(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_eq(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_ge(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_ge(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_ge$function$
;

-- Permissions

ALTER FUNCTION public.ltree_ge(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_ge(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_gist_in(cstring);

CREATE OR REPLACE FUNCTION public.ltree_gist_in(cstring)
 RETURNS ltree_gist
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_gist_in$function$
;

-- Permissions

ALTER FUNCTION public.ltree_gist_in(cstring) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_gist_in(cstring) TO postgres;

-- DROP FUNCTION public.ltree_gist_options(internal);

CREATE OR REPLACE FUNCTION public.ltree_gist_options(internal)
 RETURNS void
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE
AS '$libdir/ltree', $function$ltree_gist_options$function$
;

-- Permissions

ALTER FUNCTION public.ltree_gist_options(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_gist_options(internal) TO postgres;

-- DROP FUNCTION public.ltree_gist_out(ltree_gist);

CREATE OR REPLACE FUNCTION public.ltree_gist_out(ltree_gist)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_gist_out$function$
;

-- Permissions

ALTER FUNCTION public.ltree_gist_out(ltree_gist) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_gist_out(ltree_gist) TO postgres;

-- DROP FUNCTION public.ltree_gt(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_gt(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_gt$function$
;

-- Permissions

ALTER FUNCTION public.ltree_gt(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_gt(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_in(cstring);

CREATE OR REPLACE FUNCTION public.ltree_in(cstring)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_in$function$
;

-- Permissions

ALTER FUNCTION public.ltree_in(cstring) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_in(cstring) TO postgres;

-- DROP FUNCTION public.ltree_isparent(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_isparent(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_isparent$function$
;

-- Permissions

ALTER FUNCTION public.ltree_isparent(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_isparent(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_le(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_le(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_le$function$
;

-- Permissions

ALTER FUNCTION public.ltree_le(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_le(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_lt(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_lt(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_lt$function$
;

-- Permissions

ALTER FUNCTION public.ltree_lt(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_lt(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_ne(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_ne(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_ne$function$
;

-- Permissions

ALTER FUNCTION public.ltree_ne(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_ne(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_out(ltree);

CREATE OR REPLACE FUNCTION public.ltree_out(ltree)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_out$function$
;

-- Permissions

ALTER FUNCTION public.ltree_out(ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_out(ltree) TO postgres;

-- DROP FUNCTION public.ltree_penalty(internal, internal, internal);

CREATE OR REPLACE FUNCTION public.ltree_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_penalty$function$
;

-- Permissions

ALTER FUNCTION public.ltree_penalty(internal, internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_penalty(internal, internal, internal) TO postgres;

-- DROP FUNCTION public.ltree_picksplit(internal, internal);

CREATE OR REPLACE FUNCTION public.ltree_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_picksplit$function$
;

-- Permissions

ALTER FUNCTION public.ltree_picksplit(internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_picksplit(internal, internal) TO postgres;

-- DROP FUNCTION public.ltree_recv(internal);

CREATE OR REPLACE FUNCTION public.ltree_recv(internal)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_recv$function$
;

-- Permissions

ALTER FUNCTION public.ltree_recv(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_recv(internal) TO postgres;

-- DROP FUNCTION public.ltree_risparent(ltree, ltree);

CREATE OR REPLACE FUNCTION public.ltree_risparent(ltree, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_risparent$function$
;

-- Permissions

ALTER FUNCTION public.ltree_risparent(ltree, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_risparent(ltree, ltree) TO postgres;

-- DROP FUNCTION public.ltree_same(ltree_gist, ltree_gist, internal);

CREATE OR REPLACE FUNCTION public.ltree_same(ltree_gist, ltree_gist, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_same$function$
;

-- Permissions

ALTER FUNCTION public.ltree_same(ltree_gist, ltree_gist, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_same(ltree_gist, ltree_gist, internal) TO postgres;

-- DROP FUNCTION public.ltree_send(ltree);

CREATE OR REPLACE FUNCTION public.ltree_send(ltree)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_send$function$
;

-- Permissions

ALTER FUNCTION public.ltree_send(ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_send(ltree) TO postgres;

-- DROP FUNCTION public.ltree_textadd(text, ltree);

CREATE OR REPLACE FUNCTION public.ltree_textadd(text, ltree)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_textadd$function$
;

-- Permissions

ALTER FUNCTION public.ltree_textadd(text, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_textadd(text, ltree) TO postgres;

-- DROP FUNCTION public.ltree_union(internal, internal);

CREATE OR REPLACE FUNCTION public.ltree_union(internal, internal)
 RETURNS ltree_gist
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltree_union$function$
;

-- Permissions

ALTER FUNCTION public.ltree_union(internal, internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltree_union(internal, internal) TO postgres;

-- DROP FUNCTION public.ltreeparentsel(internal, oid, internal, int4);

CREATE OR REPLACE FUNCTION public.ltreeparentsel(internal, oid, internal, integer)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltreeparentsel$function$
;

-- Permissions

ALTER FUNCTION public.ltreeparentsel(internal, oid, internal, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltreeparentsel(internal, oid, internal, int4) TO postgres;

-- DROP FUNCTION public.ltxtq_exec(ltree, ltxtquery);

CREATE OR REPLACE FUNCTION public.ltxtq_exec(ltree, ltxtquery)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltxtq_exec$function$
;

-- Permissions

ALTER FUNCTION public.ltxtq_exec(ltree, ltxtquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltxtq_exec(ltree, ltxtquery) TO postgres;

-- DROP FUNCTION public.ltxtq_in(cstring);

CREATE OR REPLACE FUNCTION public.ltxtq_in(cstring)
 RETURNS ltxtquery
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltxtq_in$function$
;

-- Permissions

ALTER FUNCTION public.ltxtq_in(cstring) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltxtq_in(cstring) TO postgres;

-- DROP FUNCTION public.ltxtq_out(ltxtquery);

CREATE OR REPLACE FUNCTION public.ltxtq_out(ltxtquery)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltxtq_out$function$
;

-- Permissions

ALTER FUNCTION public.ltxtq_out(ltxtquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltxtq_out(ltxtquery) TO postgres;

-- DROP FUNCTION public.ltxtq_recv(internal);

CREATE OR REPLACE FUNCTION public.ltxtq_recv(internal)
 RETURNS ltxtquery
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltxtq_recv$function$
;

-- Permissions

ALTER FUNCTION public.ltxtq_recv(internal) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltxtq_recv(internal) TO postgres;

-- DROP FUNCTION public.ltxtq_rexec(ltxtquery, ltree);

CREATE OR REPLACE FUNCTION public.ltxtq_rexec(ltxtquery, ltree)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltxtq_rexec$function$
;

-- Permissions

ALTER FUNCTION public.ltxtq_rexec(ltxtquery, ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltxtq_rexec(ltxtquery, ltree) TO postgres;

-- DROP FUNCTION public.ltxtq_send(ltxtquery);

CREATE OR REPLACE FUNCTION public.ltxtq_send(ltxtquery)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$ltxtq_send$function$
;

-- Permissions

ALTER FUNCTION public.ltxtq_send(ltxtquery) OWNER TO postgres;
GRANT ALL ON FUNCTION public.ltxtq_send(ltxtquery) TO postgres;

-- DROP AGGREGATE public.max(citext);

CREATE OR REPLACE AGGREGATE public.max(public.citext) (
	SFUNC = citext_larger,
	STYPE = citext,
	SORTOP = >
);

-- Permissions

ALTER AGGREGATE public.max(citext) OWNER TO postgres;
GRANT ALL ON AGGREGATE public.max(citext) TO postgres;

-- DROP AGGREGATE public.min(citext);

CREATE OR REPLACE AGGREGATE public.min(public.citext) (
	SFUNC = citext_smaller,
	STYPE = citext,
	SORTOP = <
);

-- Permissions

ALTER AGGREGATE public.min(citext) OWNER TO postgres;
GRANT ALL ON AGGREGATE public.min(citext) TO postgres;

-- DROP FUNCTION public.nlevel(ltree);

CREATE OR REPLACE FUNCTION public.nlevel(ltree)
 RETURNS integer
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$nlevel$function$
;

-- Permissions

ALTER FUNCTION public.nlevel(ltree) OWNER TO postgres;
GRANT ALL ON FUNCTION public.nlevel(ltree) TO postgres;

-- DROP FUNCTION public.pgp_armor_headers(in text, out text, out text);

CREATE OR REPLACE FUNCTION public.pgp_armor_headers(text, OUT key text, OUT value text)
 RETURNS SETOF record
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$
;

-- Permissions

ALTER FUNCTION public.pgp_armor_headers(in text, out text, out text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_armor_headers(in text, out text, out text) TO postgres;

-- DROP FUNCTION public.pgp_key_id(bytea);

CREATE OR REPLACE FUNCTION public.pgp_key_id(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$
;

-- Permissions

ALTER FUNCTION public.pgp_key_id(bytea) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_key_id(bytea) TO postgres;

-- DROP FUNCTION public.pgp_pub_decrypt(bytea, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_decrypt(bytea, bytea) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea) TO postgres;

-- DROP FUNCTION public.pgp_pub_decrypt(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_decrypt(bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres;

-- DROP FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres;

-- DROP FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres;

-- DROP FUNCTION public.pgp_pub_encrypt(text, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt(text, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_encrypt(text, bytea) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea) TO postgres;

-- DROP FUNCTION public.pgp_pub_encrypt(text, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt(text, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_encrypt(text, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres;

-- DROP FUNCTION public.pgp_sym_decrypt(bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_decrypt(bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_decrypt(bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_decrypt(bytea, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_decrypt_bytea(bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_decrypt_bytea(bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_encrypt(text, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(text, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_encrypt(text, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_encrypt(text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_encrypt(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_encrypt_bytea(bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_encrypt_bytea(bytea, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text) TO postgres;

-- DROP FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$
;

-- Permissions

ALTER FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres;

-- DROP FUNCTION public.regexp_match(citext, citext);

CREATE OR REPLACE FUNCTION public.regexp_match(string citext, pattern citext)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_match((string)::text, (pattern)::text, 'i'::text)
;

-- Permissions

ALTER FUNCTION public.regexp_match(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_match(citext, citext) TO postgres;

-- DROP FUNCTION public.regexp_match(citext, citext, text);

CREATE OR REPLACE FUNCTION public.regexp_match(string citext, pattern citext, flags text)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_match((string)::text, (pattern)::text, CASE WHEN (strpos(flags, 'c'::text) = 0) THEN (flags || 'i'::text) ELSE flags END)
;

-- Permissions

ALTER FUNCTION public.regexp_match(citext, citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_match(citext, citext, text) TO postgres;

-- DROP FUNCTION public.regexp_matches(citext, citext, text);

CREATE OR REPLACE FUNCTION public.regexp_matches(string citext, pattern citext, flags text)
 RETURNS SETOF text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT ROWS 10
RETURN regexp_matches((string)::text, (pattern)::text, CASE WHEN (strpos(flags, 'c'::text) = 0) THEN (flags || 'i'::text) ELSE flags END)
;

-- Permissions

ALTER FUNCTION public.regexp_matches(citext, citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_matches(citext, citext, text) TO postgres;

-- DROP FUNCTION public.regexp_matches(citext, citext);

CREATE OR REPLACE FUNCTION public.regexp_matches(string citext, pattern citext)
 RETURNS SETOF text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT ROWS 1
RETURN regexp_matches((string)::text, (pattern)::text, 'i'::text)
;

-- Permissions

ALTER FUNCTION public.regexp_matches(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_matches(citext, citext) TO postgres;

-- DROP FUNCTION public.regexp_replace(citext, citext, text, text);

CREATE OR REPLACE FUNCTION public.regexp_replace(string citext, pattern citext, replacement text, flags text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_replace((string)::text, (pattern)::text, replacement, CASE WHEN (strpos(flags, 'c'::text) = 0) THEN (flags || 'i'::text) ELSE flags END)
;

-- Permissions

ALTER FUNCTION public.regexp_replace(citext, citext, text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_replace(citext, citext, text, text) TO postgres;

-- DROP FUNCTION public.regexp_replace(citext, citext, text);

CREATE OR REPLACE FUNCTION public.regexp_replace(string citext, pattern citext, replacement text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_replace((string)::text, (pattern)::text, replacement, 'i'::text)
;

-- Permissions

ALTER FUNCTION public.regexp_replace(citext, citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_replace(citext, citext, text) TO postgres;

-- DROP FUNCTION public.regexp_split_to_array(citext, citext);

CREATE OR REPLACE FUNCTION public.regexp_split_to_array(string citext, pattern citext)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_split_to_array((string)::text, (pattern)::text, 'i'::text)
;

-- Permissions

ALTER FUNCTION public.regexp_split_to_array(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_split_to_array(citext, citext) TO postgres;

-- DROP FUNCTION public.regexp_split_to_array(citext, citext, text);

CREATE OR REPLACE FUNCTION public.regexp_split_to_array(string citext, pattern citext, flags text)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_split_to_array((string)::text, (pattern)::text, CASE WHEN (strpos(flags, 'c'::text) = 0) THEN (flags || 'i'::text) ELSE flags END)
;

-- Permissions

ALTER FUNCTION public.regexp_split_to_array(citext, citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_split_to_array(citext, citext, text) TO postgres;

-- DROP FUNCTION public.regexp_split_to_table(citext, citext, text);

CREATE OR REPLACE FUNCTION public.regexp_split_to_table(string citext, pattern citext, flags text)
 RETURNS SETOF text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_split_to_table((string)::text, (pattern)::text, CASE WHEN (strpos(flags, 'c'::text) = 0) THEN (flags || 'i'::text) ELSE flags END)
;

-- Permissions

ALTER FUNCTION public.regexp_split_to_table(citext, citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_split_to_table(citext, citext, text) TO postgres;

-- DROP FUNCTION public.regexp_split_to_table(citext, citext);

CREATE OR REPLACE FUNCTION public.regexp_split_to_table(string citext, pattern citext)
 RETURNS SETOF text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_split_to_table((string)::text, (pattern)::text, 'i'::text)
;

-- Permissions

ALTER FUNCTION public.regexp_split_to_table(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.regexp_split_to_table(citext, citext) TO postgres;

-- DROP FUNCTION public."replace"(citext, citext, citext);

CREATE OR REPLACE FUNCTION public.replace(citext, citext, citext)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN regexp_replace(($1)::text, regexp_replace(($2)::text, '([^a-zA-Z_0-9])'::text, '\\\1'::text, 'g'::text), ($3)::text, 'gi'::text)
;

-- Permissions

ALTER FUNCTION public."replace"(citext, citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public."replace"(citext, citext, citext) TO postgres;

-- DROP FUNCTION public.set_limit(float4);

CREATE OR REPLACE FUNCTION public.set_limit(real)
 RETURNS real
 LANGUAGE c
 STRICT
AS '$libdir/pg_trgm', $function$set_limit$function$
;

-- Permissions

ALTER FUNCTION public.set_limit(float4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.set_limit(float4) TO postgres;

-- DROP FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.set_updated_at() OWNER TO postgres;
GRANT ALL ON FUNCTION public.set_updated_at() TO postgres;

-- DROP FUNCTION public.show_limit();

CREATE OR REPLACE FUNCTION public.show_limit()
 RETURNS real
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_limit$function$
;

-- Permissions

ALTER FUNCTION public.show_limit() OWNER TO postgres;
GRANT ALL ON FUNCTION public.show_limit() TO postgres;

-- DROP FUNCTION public.show_trgm(text);

CREATE OR REPLACE FUNCTION public.show_trgm(text)
 RETURNS text[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_trgm$function$
;

-- Permissions

ALTER FUNCTION public.show_trgm(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.show_trgm(text) TO postgres;

-- DROP FUNCTION public.similarity(text, text);

CREATE OR REPLACE FUNCTION public.similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity$function$
;

-- Permissions

ALTER FUNCTION public.similarity(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.similarity(text, text) TO postgres;

-- DROP FUNCTION public.similarity_dist(text, text);

CREATE OR REPLACE FUNCTION public.similarity_dist(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_dist$function$
;

-- Permissions

ALTER FUNCTION public.similarity_dist(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO postgres;

-- DROP FUNCTION public.similarity_op(text, text);

CREATE OR REPLACE FUNCTION public.similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_op$function$
;

-- Permissions

ALTER FUNCTION public.similarity_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO postgres;

-- DROP FUNCTION public.split_part(citext, citext, int4);

CREATE OR REPLACE FUNCTION public.split_part(citext, citext, integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN (regexp_split_to_array(($1)::text, regexp_replace(($2)::text, '([^a-zA-Z_0-9])'::text, '\\\1'::text, 'g'::text), 'i'::text))[$3]
;

-- Permissions

ALTER FUNCTION public.split_part(citext, citext, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.split_part(citext, citext, int4) TO postgres;

-- DROP FUNCTION public.strict_word_similarity(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO postgres;

-- DROP FUNCTION public.strict_word_similarity_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_commutator_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO postgres;

-- DROP FUNCTION public.strict_word_similarity_dist_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO postgres;

-- DROP FUNCTION public.strict_word_similarity_dist_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_dist_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO postgres;

-- DROP FUNCTION public.strict_word_similarity_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO postgres;

-- DROP FUNCTION public.strpos(citext, citext);

CREATE OR REPLACE FUNCTION public.strpos(citext, citext)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN strpos(lower(($1)::text), lower(($2)::text))
;

-- Permissions

ALTER FUNCTION public.strpos(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.strpos(citext, citext) TO postgres;

-- DROP FUNCTION public.subltree(ltree, int4, int4);

CREATE OR REPLACE FUNCTION public.subltree(ltree, integer, integer)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$subltree$function$
;

-- Permissions

ALTER FUNCTION public.subltree(ltree, int4, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.subltree(ltree, int4, int4) TO postgres;

-- DROP FUNCTION public.subpath(ltree, int4);

CREATE OR REPLACE FUNCTION public.subpath(ltree, integer)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$subpath$function$
;

-- Permissions

ALTER FUNCTION public.subpath(ltree, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.subpath(ltree, int4) TO postgres;

-- DROP FUNCTION public.subpath(ltree, int4, int4);

CREATE OR REPLACE FUNCTION public.subpath(ltree, integer, integer)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$subpath$function$
;

-- Permissions

ALTER FUNCTION public.subpath(ltree, int4, int4) OWNER TO postgres;
GRANT ALL ON FUNCTION public.subpath(ltree, int4, int4) TO postgres;

-- DROP FUNCTION public.suggest_hypothesis_transition();

CREATE OR REPLACE FUNCTION public.suggest_hypothesis_transition()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'analyzed' AND NEW.result IS NOT NULL THEN
    INSERT INTO entity_events (
      workspace_id, entity_type, entity_id, event_type,
      payload, actor_id
    ) VALUES (
      NEW.workspace_id, 'hypotheses', NEW.hypothesis_id, 'transition_suggested',
      jsonb_build_object(
        'reason', 'experiment_analyzed',
        'experiment_id', NEW.id,
        'experiment_result', NEW.result,
        'suggested_status', CASE 
          WHEN NEW.result = 'validated' THEN 'validated'
          WHEN NEW.result = 'invalidated' THEN 'invalidated'
          ELSE null
        END
      ),
      current_actor_id()
    );
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.suggest_hypothesis_transition() OWNER TO postgres;
GRANT ALL ON FUNCTION public.suggest_hypothesis_transition() TO postgres;

-- DROP FUNCTION public.text2ltree(text);

CREATE OR REPLACE FUNCTION public.text2ltree(text)
 RETURNS ltree
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/ltree', $function$text2ltree$function$
;

-- Permissions

ALTER FUNCTION public.text2ltree(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.text2ltree(text) TO postgres;

-- DROP FUNCTION public.texticlike(citext, text);

CREATE OR REPLACE FUNCTION public.texticlike(citext, text)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticlike$function$
;

-- Permissions

ALTER FUNCTION public.texticlike(citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticlike(citext, text) TO postgres;

-- DROP FUNCTION public.texticlike(citext, citext);

CREATE OR REPLACE FUNCTION public.texticlike(citext, citext)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticlike$function$
;

-- Permissions

ALTER FUNCTION public.texticlike(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticlike(citext, citext) TO postgres;

-- DROP FUNCTION public.texticnlike(citext, text);

CREATE OR REPLACE FUNCTION public.texticnlike(citext, text)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticnlike$function$
;

-- Permissions

ALTER FUNCTION public.texticnlike(citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticnlike(citext, text) TO postgres;

-- DROP FUNCTION public.texticnlike(citext, citext);

CREATE OR REPLACE FUNCTION public.texticnlike(citext, citext)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticnlike$function$
;

-- Permissions

ALTER FUNCTION public.texticnlike(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticnlike(citext, citext) TO postgres;

-- DROP FUNCTION public.texticregexeq(citext, text);

CREATE OR REPLACE FUNCTION public.texticregexeq(citext, text)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticregexeq$function$
;

-- Permissions

ALTER FUNCTION public.texticregexeq(citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticregexeq(citext, text) TO postgres;

-- DROP FUNCTION public.texticregexeq(citext, citext);

CREATE OR REPLACE FUNCTION public.texticregexeq(citext, citext)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticregexeq$function$
;

-- Permissions

ALTER FUNCTION public.texticregexeq(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticregexeq(citext, citext) TO postgres;

-- DROP FUNCTION public.texticregexne(citext, citext);

CREATE OR REPLACE FUNCTION public.texticregexne(citext, citext)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticregexne$function$
;

-- Permissions

ALTER FUNCTION public.texticregexne(citext, citext) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticregexne(citext, citext) TO postgres;

-- DROP FUNCTION public.texticregexne(citext, text);

CREATE OR REPLACE FUNCTION public.texticregexne(citext, text)
 RETURNS boolean
 LANGUAGE internal
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$texticregexne$function$
;

-- Permissions

ALTER FUNCTION public.texticregexne(citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.texticregexne(citext, text) TO postgres;

-- DROP FUNCTION public."translate"(citext, citext, text);

CREATE OR REPLACE FUNCTION public.translate(citext, citext, text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
RETURN translate(translate(($1)::text, lower(($2)::text), $3), upper(($2)::text), $3)
;

-- Permissions

ALTER FUNCTION public."translate"(citext, citext, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public."translate"(citext, citext, text) TO postgres;

-- DROP FUNCTION public.update_search_vector();

CREATE OR REPLACE FUNCTION public.update_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'hypotheses' THEN
    NEW.search_vector := to_tsvector('portuguese',
      coalesce(NEW.title, '')        || ' ' ||
      coalesce(NEW.if_clause, '')    || ' ' ||
      coalesce(NEW.then_clause, '')  || ' ' ||
      coalesce(NEW.because_clause, ''));
  ELSE
    NEW.search_vector := to_tsvector('portuguese',
      coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.update_search_vector() OWNER TO postgres;
GRANT ALL ON FUNCTION public.update_search_vector() TO postgres;

-- DROP FUNCTION public.uuid_generate_v1();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v1() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v1() TO postgres;

-- DROP FUNCTION public.uuid_generate_v1mc();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v1mc() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO postgres;

-- DROP FUNCTION public.uuid_generate_v3(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v3(uuid, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v3(uuid, text) TO postgres;

-- DROP FUNCTION public.uuid_generate_v4();

CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v4() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v4() TO postgres;

-- DROP FUNCTION public.uuid_generate_v5(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v5(uuid, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_generate_v5(uuid, text) TO postgres;

-- DROP FUNCTION public.uuid_nil();

CREATE OR REPLACE FUNCTION public.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$
;

-- Permissions

ALTER FUNCTION public.uuid_nil() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_nil() TO postgres;

-- DROP FUNCTION public.uuid_ns_dns();

CREATE OR REPLACE FUNCTION public.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_dns() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_dns() TO postgres;

-- DROP FUNCTION public.uuid_ns_oid();

CREATE OR REPLACE FUNCTION public.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_oid() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_oid() TO postgres;

-- DROP FUNCTION public.uuid_ns_url();

CREATE OR REPLACE FUNCTION public.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_url() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_url() TO postgres;

-- DROP FUNCTION public.uuid_ns_x500();

CREATE OR REPLACE FUNCTION public.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_x500() OWNER TO postgres;
GRANT ALL ON FUNCTION public.uuid_ns_x500() TO postgres;

-- DROP FUNCTION public.validate_experiment_to_running();

CREATE OR REPLACE FUNCTION public.validate_experiment_to_running()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'running' AND OLD.status = 'planned' THEN
    IF NEW.success_criteria IS NULL OR length(trim(NEW.success_criteria)) < 10 THEN
      RAISE EXCEPTION 'Experiment success_criteria must be defined (min 10 chars) before running'
        USING HINT = 'Define a clear, measurable success criterion';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.validate_experiment_to_running() OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_experiment_to_running() TO postgres;

-- DROP FUNCTION public.validate_hypothesis_to_validated();

CREATE OR REPLACE FUNCTION public.validate_hypothesis_to_validated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'validated' AND OLD.status != 'validated' THEN
    IF NOT EXISTS (
      SELECT 1 FROM experiments
      WHERE hypothesis_id = NEW.id
        AND status = 'analyzed'
        AND result = 'validated'
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot transition hypothesis to validated without at least one analyzed experiment with result=validated'
        USING HINT = 'Create and analyze an experiment first, or use status=in_execution if proceeding without formal validation';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.validate_hypothesis_to_validated() OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_hypothesis_to_validated() TO postgres;

-- DROP FUNCTION public.validate_lifecycle_transition();

CREATE OR REPLACE FUNCTION public.validate_lifecycle_transition()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_from text;
  v_to text;
  v_transition record;
  v_reason_value text;
  v_old_jsonb jsonb;
  v_new_jsonb jsonb;
BEGIN
  v_old_jsonb := to_jsonb(OLD);
  v_new_jsonb := to_jsonb(NEW);
  
  v_from := v_old_jsonb->>'status';
  v_to := v_new_jsonb->>'status';
  
  IF v_from = v_to THEN
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_transition
  FROM lifecycle_transitions
  WHERE entity_type = TG_TABLE_NAME
    AND from_status = v_from
    AND to_status = v_to;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid lifecycle transition for %: % -> % is not allowed',
      TG_TABLE_NAME, v_from, v_to
      USING HINT = 'Check lifecycle_transitions table for allowed transitions';
  END IF;
  
  IF v_transition.requires_reason AND v_transition.reason_field IS NOT NULL THEN
    v_reason_value := v_new_jsonb->>v_transition.reason_field;
    IF v_reason_value IS NULL OR length(trim(v_reason_value)) = 0 THEN
      RAISE EXCEPTION 'Transition % -> % on % requires a reason in field "%"',
        v_from, v_to, TG_TABLE_NAME, v_transition.reason_field
        USING HINT = 'Provide a non-empty value for the reason field';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.validate_lifecycle_transition() OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_lifecycle_transition() TO postgres;

-- DROP FUNCTION public.validate_link_same_workspace();

CREATE OR REPLACE FUNCTION public.validate_link_same_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_left_workspace uuid;
  v_right_workspace uuid;
  v_left_table text;
  v_right_table text;
  v_left_id_col text;
  v_right_id_col text;
BEGIN
  v_left_table := TG_ARGV[0];
  v_left_id_col := TG_ARGV[1];
  v_right_table := TG_ARGV[2];
  v_right_id_col := TG_ARGV[3];
  
  EXECUTE format(
    'SELECT workspace_id FROM %I WHERE id = ($1->>%L)::uuid',
    v_left_table, v_left_id_col
  ) INTO v_left_workspace USING to_jsonb(NEW);
  
  EXECUTE format(
    'SELECT workspace_id FROM %I WHERE id = ($1->>%L)::uuid',
    v_right_table, v_right_id_col
  ) INTO v_right_workspace USING to_jsonb(NEW);
  
  IF v_left_workspace IS NULL OR v_right_workspace IS NULL THEN
    RAISE EXCEPTION 'Link references non-existent entity';
  END IF;
  
  IF v_left_workspace != v_right_workspace THEN
    RAISE EXCEPTION 'Cross-workspace link not allowed: % (workspace %) <> % (workspace %)',
      v_left_table, v_left_workspace, v_right_table, v_right_workspace;
  END IF;
  
  IF NEW.workspace_id != v_left_workspace THEN
    RAISE EXCEPTION 'Link workspace_id (%) does not match entities workspace (%)',
      NEW.workspace_id, v_left_workspace;
  END IF;
  
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.validate_link_same_workspace() OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_link_same_workspace() TO postgres;

-- DROP FUNCTION public.validate_product_ownership_roles();

CREATE OR REPLACE FUNCTION public.validate_product_ownership_roles()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.director_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.product_members pm
                      WHERE pm.product_id = NEW.id
                        AND pm.user_id    = NEW.director_id
                        AND pm.role       = 'director'::public.product_role) THEN
    RAISE EXCEPTION
      'User % must be a product_member with role=director to be director_id of product %',
      NEW.director_id, NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.pm_owner_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.product_members pm
                      WHERE pm.product_id = NEW.id
                        AND pm.user_id    = NEW.pm_owner_id
                        AND pm.role       = 'pm'::public.product_role) THEN
    RAISE EXCEPTION
      'User % must be a product_member with role=pm to be pm_owner_id of product %',
      NEW.pm_owner_id, NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.ux_owner_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.product_members pm
                      WHERE pm.product_id = NEW.id
                        AND pm.user_id    = NEW.ux_owner_id
                        AND pm.role       = 'ux'::public.product_role) THEN
    RAISE EXCEPTION
      'User % must be a product_member with role=ux to be ux_owner_id of product %',
      NEW.ux_owner_id, NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.po_owner_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.product_members pm
                      WHERE pm.product_id = NEW.id
                        AND pm.user_id    = NEW.po_owner_id
                        AND pm.role       = 'po'::public.product_role) THEN
    RAISE EXCEPTION
      'User % must be a product_member with role=po to be po_owner_id of product %',
      NEW.po_owner_id, NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.validate_product_ownership_roles() OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_product_ownership_roles() TO postgres;

-- DROP FUNCTION public.validate_roadmap_proposed_to_planned();

CREATE OR REPLACE FUNCTION public.validate_roadmap_proposed_to_planned()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.type IN ('initiative', 'epic') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM hypothesis_roadmap_links hrl
      JOIN hypotheses h ON h.id = hrl.hypothesis_id
      WHERE hrl.roadmap_item_id = NEW.id
        AND h.status IN ('validated', 'in_execution', 'delivered')
        AND h.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot plan a % without at least one validated hypothesis linked',
        NEW.type
        USING HINT = 'Link a hypothesis with status validated/in_execution before planning, or set status=proposed';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.validate_roadmap_proposed_to_planned() OWNER TO postgres;
GRANT ALL ON FUNCTION public.validate_roadmap_proposed_to_planned() TO postgres;

-- DROP FUNCTION public.word_similarity(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO postgres;

-- DROP FUNCTION public.word_similarity_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_commutator_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO postgres;

-- DROP FUNCTION public.word_similarity_dist_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_dist_commutator_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO postgres;

-- DROP FUNCTION public.word_similarity_dist_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_dist_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO postgres;

-- DROP FUNCTION public.word_similarity_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_op(text, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO postgres;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;