CREATE IF NOT EXISTS TABLE order {
    id INT NOT NULL PRIMARY KEY,
    buyer_id INT NOT NULL,
    status VARCHAR(20) NOT NULL
};

CREATE IF NOT EXISTS TABLE product {
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    amount INT UNSIGNED NOT NULL
};