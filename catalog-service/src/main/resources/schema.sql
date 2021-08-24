create table if not exists `catalog-db`.`user`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR (255) not null,
    email VARCHAR (255) not null,
    password VARCHAR (255) not null,
    is_enabled TINYINT(1) not null,
    is_locked TINYINT(1) not null,
    roles VARCHAR (255) not null
);

create table if not exists `catalog-db`.`email_verification_token`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    expiration_date DATETIME NOT NULL,
    token VARCHAR (255) not null,
    constraint fk_email_verification_token_user FOREIGN KEY (id) references user(id)
    on delete cascade
    on update restrict
    );

create table if not exists `catalog-db`.`customer`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR (255) not null,
    surname VARCHAR (255) not null,
    delivery_address VARCHAR (255) not null,
    constraint fk_customer_user FOREIGN KEY (id) references user(id)
    on delete cascade
    on update restrict
    );