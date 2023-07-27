const knex = require('knex');

function connection() {
  const dbConfig = {
    client: 'mysql2',
    connection: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'backend',
    },
    pool: { min: 0, max: 7 },
  };

  return knex(dbConfig);
}

module.exports = connection;
