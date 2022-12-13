alter table public."Customer"
add is_mpin_set boolean default FALSE not null,
OWNER to postgres;