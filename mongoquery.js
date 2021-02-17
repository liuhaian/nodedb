const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID

var url = "mongodb://localhost:27017";

var client;

module.exports = {
    U,
    R,
    C,
    D
};

async function connectDB(dbname) { 
    var dbn = dbname || 'inventory';
    if (!client) client = await MongoClient.connect(url);
    return { 
        db: client.db(dbn), 
        client: client
    };
}

async function U(dbn, tb, query,newvalues){
  // console.log(JSON.stringify(newvalues))
  const { db, client } = await connectDB(dbn);
  const collection = db.collection(tb);
  const result = await db.collection(tb).updateOne(query, {$set:newvalues}, {upsert:true});
  return result;
}

async function C(dbn, tb, data){
    const { db, client } = await connectDB(dbn);
    const collection = db.collection(tb);
    let result = await collection.insertOne({
	    data:data, ctime: new Date()
    });
    return result;
}

async function R(dbn, tb, cond){
  const { db, client } = await connectDB(dbn);
  const collection = db.collection(tb);
  const result = await collection.find(cond).toArray();
  return result;
}

async function D(dbn, tb, id){
  const { db, client } = await connectDB(dbn);
  const collection = db.collection(tb);
  const result = await collection.deleteOne({ '_id': ObjectID(id)});
  return result;
}
