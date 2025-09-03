const mongoose = require('mongoose');
const Todo = require('./models/Todo');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp';

// Dummy data
const dummyTodos = [
    {
        title: "Complete project presentation",
        description: "Prepare slides and practice presentation for the quarterly review meeting",
        category: "Work",
        priority: "high",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        tags: ["presentation", "meeting", "work"],
        completed: false
    },
    {
        title: "Buy groceries",
        description: "Get vegetables, fruits, milk, and bread from the supermarket",
        category: "Personal",
        priority: "medium",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        tags: ["shopping", "food"],
        completed: false
    },
    {
        title: "Read 'The Clean Code' book",
        description: "Finish reading chapters 5-8 of Clean Code by Robert Martin",
        category: "Learning",
        priority: "low",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        tags: ["reading", "programming", "education"],
        completed: false
    },
    {
        title: "Exercise routine",
        description: "30-minute workout session - cardio and strength training",
        category: "Health",
        priority: "medium",
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        tags: ["fitness", "health", "routine"],
        completed: true
    },
    {
        title: "Plan weekend trip",
        description: "Research destinations, book accommodation, and plan activities for weekend getaway",
        category: "Personal",
        priority: "low",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        tags: ["travel", "planning", "vacation"],
        completed: false
    }
];

async function addDummyData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing todos (optional - comment out if you want to keep existing data)
        // await Todo.deleteMany({});
        // console.log('🗑️ Cleared existing todos');

        // Insert dummy data
        const insertedTodos = await Todo.insertMany(dummyTodos);
        console.log(`✅ Added ${insertedTodos.length} dummy todos:`);
        
        insertedTodos.forEach((todo, index) => {
            console.log(`${index + 1}. ${todo.title} (${todo.priority} priority, ${todo.category})`);
        });

        console.log('\n🎉 Dummy data added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding dummy data:', error);
        process.exit(1);
    }
}

addDummyData();
