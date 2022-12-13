alter table "Customer"
    add profile_picture text;
alter table "CustomerTemp"
    add profile_picture text;

alter table "Customer" alter column is_mpin_set drop not null;

alter table "CustomerTemp"
    add credit_limit double precision default 0;


alter table "Customer"
    add credit_limit double precision default 0;




