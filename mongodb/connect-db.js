const mongoose = require('mongoose');

// Ways to connect Mongodb Database

// 1st
mongoose.connect(process.env.MONGO_URI)
    .then((conn) => {
        console.log(`MongoDB Connected : ${conn.connection.host}`);
    }).catch((err) => {
        console.log('Connected Error : ', err);
        process.exit(1);
    });


// 2nd
// const connect = Promise.resolve(mongoose.connect(process.env.MONGO_URI));
// connect.then(
//     async (conn) => {
//         console.log(`MongoDB Connected : ${conn.connection.host}`);
//     },
//     (err) => {
//         console.log('Connected Error : ', err);
//         process.exit(1);
//     }
// );


// 3rd
// const connectDB = async () => {
//     try {
//         const conn = await mongoose.connect(process.env.MONGO_URI);
//         console.log(`MongoDB Connected : ${conn.connection.host}`);
//     } catch (error) {
//         console.log('Connected Error : ', error);
//         process.exit(1);
//     }
// };
// connectDB();

// 4th
// (async () => {
//     try {
//         const conn = await mongoose.connect(process.env.MONGO_URI);
//         console.log(`MongoDB Connected : ${conn.connection.host}`);
//     } catch (error) {
//         console.log('Connected Error : ', error);
//         process.exit(1);
//     }
// })();

// 5th
// mongoose.connect(process.env.MONGO_URI);
// mongoose.connection.on('connected', () => {
//     console.log(`MongoDB Connected : ${mongoose.connection.host}`);
// });

// mongoose.connection.on('error', (err) => {
//     console.log('Connected Error : ', err);
//     process.exit(1);
// });
