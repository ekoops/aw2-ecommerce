import config from "../config/config";
import {DataTypes, Options, Sequelize} from "sequelize";

const sequelize_options: Options = {
  // the sql dialect of the database
  // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
  dialect: config.db.dialect,

  // custom host; default: localhost
  host: config.db.host,
  // for postgres, you can also specify an absolute path to a directory
  // containing a UNIX socket to connect over
  // host: '/sockets/psql_sockets'.

  // custom port; default: dialect default
  port: config.db.port,

  // custom protocol; default: 'tcp'
  // postgres only, useful for Heroku

  // disable logging or provide a custom logging function; default: console.log
  // TODO
  logging: (...msg) => console.log(msg),

  // you can also pass any dialect options to the underlying dialect library
  // - default is empty
  // - currently supported: 'mysql', 'postgres', 'mssql'
  dialectOptions: {
    socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock",
    supportBigNumbers: true,
    bigNumberStrings: true,
  },

  // disable inserting undefined values as NULL
  // - default: false
  //TODO
  omitNull: true,

  // Specify options, which are used when sequelize.define is called.
  // The following example:
  //   define: { timestamps: false }
  // is basically the same as:
  //   Model.init(attributes, { timestamps: false });
  //   sequelize.define(name, attributes, { timestamps: false });
  // so defining the timestamps for each model will be not necessary
  define: {
    underscored: false,
    // freezeTableName: true,
    charset: "utf8",
    timestamps: false,
  },

  // pool configuration used to pool database connections
  // pool: {
  //   max: 5,
  //   idle: 30000,
  //   acquire: 60000,
  // },
};

// const startDbConnection = async (): Promise<Sequelize> => {
//     return sequelize.authenticate().then(() => sequelize);
// };

const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.pass,
    sequelize_options
);

const Order = sequelize.define("order", {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // primaryKey: true
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "buyer_id"
  },

  // purchasePrice: {
  //
  // }
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  tableName: "order",
  timestamps: false
});

const Product = sequelize.define("product", {
  orderId: {
    type: DataTypes.INTEGER,
    field: "order_id",
    primaryKey: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "product_id",
    primaryKey: true
  },
  amount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
}, {
  tableName: "product",
  timestamps: false
});

Order.hasMany(Product, {
  foreignKey: "order_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE"
});
Product.belongsTo(Order);

(async () => {
  await sequelize.authenticate()
})();

const models = {
  Order
}

export default models;
