alter table "CustomerTemp"
    add panno text;

alter table "CustomerTemp"
    add is_panno_verified  boolean default FALSE;