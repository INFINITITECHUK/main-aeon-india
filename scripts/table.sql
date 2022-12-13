
-- auto-generated definition
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table "Customer"
(
    id              serial                              not null
        constraint customer_pk
            primary key,
    idx             uuid default uuid_generate_v1() not null,
    first_name      text                                not null,
    middle_name     text,
    last_name       text                                not null,
    email           text                                not null,
    gender          text,
    mobile_number   text                                not null,
    date_of_birth   date,
    id_type         text                                not null,
    id_no           text                                not null,
    id_expiry_date  date                                not null,
    city_state      text                                not null,
    district        text                                not null,
    created_on      timestamp default CURRENT_TIMESTAMP not null,
    is_obsolete     boolean   default false,
    is_active     boolean   default true,
    modified_on     timestamp default CURRENT_TIMESTAMP
);

alter table "Customer"
    owner to postgres;

create table "CustomerTemp"
(
    id              serial                              not null
        constraint customertemp_pk
            primary key,
    idx             uuid default uuid_generate_v1() not null,
    customer_id     bigint,
    first_name      text,
    middle_name     text,
    last_name       text           ,
    email           text             ,
    gender          text,
    mobile_number   text       ,
    date_of_birth   date,
    id_type         text                     ,
    id_no           text                         ,
    id_expiry_date  text                          ,
    city_state      text                          ,
    district        text                         ,
    created_on      timestamp default CURRENT_TIMESTAMP not null,
    is_obsolete     boolean   default false,
    modified_on     timestamp default CURRENT_TIMESTAMP,
    created_by      uuid                                ,
    status          text                                not null,
    operation          text                                not null
);

alter table "CustomerTemp"
    owner to postgres;

create table "CustomerDevice"
(
    id                       serial                          not null
        constraint "CustomerDevice_pkey"
            primary key,
    idx                      uuid default uuid_generate_v1() not null
        constraint "CustomerDevice_idx_key"
            unique,
    phone_ext                text                            not null,
    mobile_number            text                            not null,
    phone_brand              text,                             
    phone_os                 text,                        
    os_version               text,                          
    deviceid                 text                            not null,
    otp                      text                            not null,
    token                    text,
    otp_type                 text,
    otp_status boolean not null default false,
    total_attempt bigint default 0,
    is_obsolete boolean NOT NULL default false,
    otp_created_at timestamp without time zone NOT NULL,
    created_on timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

alter table "CustomerDevice"
    owner to postgres;
