rsconf = {
  _id: "rs0",
  members: [
    { _id: 0, host: "warehouse-db-rs0-1:27017"},
    { _id: 1, host: "warehouse-db-rs0-2:27017"},
    { _id: 2, host: "warehouse-db-rs0-3:27017"}
  ]
};

rs.initiate(rsconf);

conf = rs.config();
conf.members[0].priority = 2;
rs.reconfig(conf);
rs.conf();