alter table "Customer"
    add password text;

alter table "Customer"
    add is_password_set  boolean default FALSE;