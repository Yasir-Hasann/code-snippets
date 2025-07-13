const dropCollections = async () => {
  try {
    const collections = await mongoose.connection.listCollections();
    for (let collectionName of collections) {
      await mongoose.connection.dropCollection(collectionName.name);
      console.log(`Dropped collection: ${collectionName.name}`);
    }
  } catch (error) {
    console.error('Error dropping collections:', error);
  } finally {
    mongoose.connection.close();
  }
};

const cleanDatabase = async () => {
  try {
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({});
      // await collection.drop();
      console.log(`Cleared collection: ${collectionName}`);
    }
    console.log('Database cleaned successfully.');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
};
