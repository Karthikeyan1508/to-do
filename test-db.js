const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://karthikeyan36947_db_user:GykZhzYXLbmq38B0@cluster0.kva9fo9.mongodb.net/todoapp?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    process.exit(0);
})
.catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error('❌ Connection timeout after 10 seconds');
    process.exit(1);
}, 10000);
