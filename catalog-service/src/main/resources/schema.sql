create table if not exists `catalogservice`.`user`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR (256) not null,
    surname VARCHAR (256) not null,
    email VARCHAR (256) not null,
    delivery_address VARCHAR (256) not null,
    role VARCHAR (256) not null
);

create table if not exists `catalogservice`.`emailVerificationToken`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    expirationDate DATE NOT NULL,
    token VARCHAR (256) not null,
    user_id INTEGER NOT NULL,
    constraint fk_user FOREIGN KEY (user_id) references user(id)
    on delete cascade
    on update restrict
    );