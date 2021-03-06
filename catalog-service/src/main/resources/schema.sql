create table if not exists `catalog-db`.`user`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR (255) not null,
    email VARCHAR (255) not null,
    password VARCHAR (255) not null,
    is_enabled TINYINT(1) not null,
    is_locked TINYINT(1) not null,
    roles VARCHAR (255) not null,
    name VARCHAR (255) not null,
    surname VARCHAR (255) not null,
    delivery_address VARCHAR (255),
    constraint username_unique unique (username),
    constraint email_unique unique (email)
);

create table if not exists `catalog-db`.`email_verification_token`(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    expiration_date DATETIME NOT NULL,
    token VARCHAR (255) not null,
    constraint fk_email_verification_token_user FOREIGN KEY (id) references user(id)
    on delete cascade
    on update restrict
    );


-- INSERT IGNORE INTO `catalog-db`.`user`(id, username, email, password, is_enabled, is_locked, roles, name, surname, delivery_address)
--     VALUES (1, "user1", "user1@yopmail.com", "{bcrypt}$2a$10$4UkJEJ3UQCZEeSUt/zoMC.j3YyxkPFS5j8mheomTIL0W8Q7vx/ta2", 1, 0, "ADMIN,CUSTOMER", "user1_name", "user1_surname", "user1_deliveryAddres");
--
-- INSERT IGNORE INTO `catalog-db`.`user`(id, username, email, password, is_enabled, is_locked, roles)
--     VALUES (2, "user2", "user2@yopmail.com", "{bcrypt}$2a$10$4UkJEJ3UQCZEeSUt/zoMC.j3YyxkPFS5j8mheomTIL0W8Q7vx/ta2", 1, 0, "ADMIN", "user2_name", "user2_surname");
--
-- INSERT IGNORE INTO `catalog-db`.`user`(id, username, email, password, is_enabled, is_locked, roles)
--     VALUES (3, "user3", "user3@yopmail.com", "{bcrypt}$2a$10$4UkJEJ3UQCZEeSUt/zoMC.j3YyxkPFS5j8mheomTIL0W8Q7vx/ta2", 1, 0, "CUSTOMER", "user3_name", "user3_surname", "user3_deliveryAddres");
