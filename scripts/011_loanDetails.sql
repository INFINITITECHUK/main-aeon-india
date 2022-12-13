create table "LoanDetails"
(
    id               serial                               not null
        constraint customer_pk
            primary key,
    idx              uuid      default uuid_generate_v1() not null,
    created_on       timestamp default now()              not null,
    is_obsolete      boolean   default false,
    is_active        boolean   default true,
    modified_on      timestamp default now(),
    customer_idx     uuid                                 not null,
    requested_amount double precision                     not null,
    id_card_front    text                                 not null,
    id_card_back     text                                 not null,
    verification_doc text                                 not null,
    loan_id          uuid                                 not null,
    status           text      default 'PENDING'::text    not null
);

alter table "LoanDetails"
    owner to postgres;

create unique index loandetails_loan_id_uindex
    on "LoanDetails" (loan_id);

alter table "TransactionDetail"
    add loan_agreement_no int;

alter table "LoanDetails"
    add loan_agreement_no int;

