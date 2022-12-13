alter table "Customer"
    add panno text not null;

alter table "Customer"
    add is_panno_verified  boolean default FALSE not null,;