create table if not exists `catalogservice`.`user`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR (255) not null,
    email VARCHAR (255) not null,
    password VARCHAR (255) not null,
    isEnable TINYINT(1) not null,
    isLocked TINYINT(1) not null,
    role VARCHAR (255) not null
);

create table if not exists `catalogservice`.`emailVerificationToken`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    expirationDate DATE NOT NULL,
    token VARCHAR (255) not null,
    user_id INTEGER NOT NULL,
    constraint fk_emailVerificationToken_user FOREIGN KEY (user_id) references user(id)
    on delete cascade
    on update restrict
    );

create table if not exists `catalogservice`.`customer`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR (255) not null,
    surname VARCHAR (255) not null,
    delivery_address VARCHAR (255) not null,
    user_id INTEGER NOT NULL,
    constraint fk_customer_user FOREIGN KEY (user_id) references user(id)
    on delete cascade
    on update restrict
    );