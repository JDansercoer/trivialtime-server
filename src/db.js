import { MongoClient } from "mongodb";

export default callback => {
  // connect to a database if needed, then pass it to `callback`:

  // const uri =
  //   "mongodb+srv://dbadmin:6x9X7J4ESKfc55WMYBn8@trivialtime-5taix.gcp.mongodb.net/trivialTime?retryWrites=true";
  // const client = new MongoClient(uri, { useNewUrlParser: true });
  // client.connect(err => {
  //   const database = client.db("trivialTime");

  //   callback(database);
  // });

  callback();
};
