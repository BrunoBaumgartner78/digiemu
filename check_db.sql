select
  current_database() as db,
  current_schema() as schema,
  inet_server_addr() as server_ip,
  inet_server_port() as port;
