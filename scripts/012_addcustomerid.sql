alter table public."CustomerDevice"
add customer_id bigint,
OWNER to postgres;

ALTER TABLE "CustomerDevice"
ADD CONSTRAINT customer_id
FOREIGN KEY (customer_id) REFERENCES "Customer"(id);