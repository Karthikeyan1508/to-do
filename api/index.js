require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://karthikeyan36947_db_user:GykZhzYXLbmq38B0@cluster0.kva9fo9.mongodb.net/todoapp?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔧 Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- MONGODB_URI starts with:', MONGODB_URI.substring(0, 25) + '...');

// Basic middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// Static files - fix for Vercel
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use(express.static(path.join(__dirname, '../public')));

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// View engine setup
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Database connection (with better error handling for serverless)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('✅ MongoDB already connected');
        return;
    }
    
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('🔗 Connection string:', MONGODB_URI.substring(0, 25) + '...');
        
        await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
        });
        
        isConnected = true;
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('❌ Full error:', error);
        isConnected = false;
        throw error;
    }
};

// Connect to database immediately
connectDB().catch(err => {
    console.error('❌ Initial database connection failed:', err.message);
});

// Import models and controllers
const Todo = require('../models/Todo');

// Simple todo controller for Vercel
const todoController = {
    async getAllTodos(req, res) {
        try {
            await connectDB(); // Ensure connection
            
            const { filter, sort, category, priority } = req.query;
            let query = {};
            let sortOptions = {};

            // Apply filters
            if (filter === 'completed') {
                query.completed = true;
            } else if (filter === 'pending') {
                query.completed = false;
            } else if (filter === 'overdue') {
                query.completed = false;
                query.dueDate = { $lt: new Date() };
            }

            if (category && category !== 'all') {
                query.category = category;
            }

            if (priority && priority !== 'all') {
                query.priority = priority;
            }

            // Apply sorting
            switch (sort) {
                case 'oldest':
                    sortOptions = { createdAt: 1 };
                    break;
                case 'due':
                    sortOptions = { dueDate: 1 };
                    break;
                case 'priority':
                    sortOptions = { priority: 1 };
                    break;
                default:
                    sortOptions = { createdAt: -1 };
            }

            const todos = await Todo.find(query).sort(sortOptions);

            // Get statistics
            const totalTodos = await Todo.countDocuments();
            const completedTodos = await Todo.countDocuments({ completed: true });
            const pendingTodos = await Todo.countDocuments({ completed: false });
            const overdueTodos = await Todo.countDocuments({
                completed: false,
                dueDate: { $lt: new Date() }
            });

            // Get unique categories
            const categories = await Todo.distinct('category');

            const stats = {
                total: totalTodos,
                completed: completedTodos,
                pending: pendingTodos,
                overdue: overdueTodos
            };

            res.render('todos/index', {
                title: 'Todo Manager',
                todos,
                stats,
                categories,
                currentFilter: filter || 'all',
                currentSort: sort || 'newest',
                currentCategory: category || 'all',
                currentPriority: priority || 'all'
            });
        } catch (error) {
            console.error('Error fetching todos:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error fetching todos. Please try again.',
                error: {}
            });
        }
    },

    async createTodo(req, res) {
        try {
            await connectDB();
            
            const { title, description, priority, category, dueDate, tags } = req.body;
            
            const todo = new Todo({
                title,
                description,
                priority: priority || 'medium',
                category: category || 'general',
                dueDate: dueDate || null,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : []
            });

            await todo.save();
            res.redirect('/todos');
        } catch (error) {
            console.error('Error creating todo:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error creating todo.',
                error: {}
            });
        }
    },

    async showEditForm(req, res) {
        try {
            await connectDB();
            const todo = await Todo.findById(req.params.id);
            if (!todo) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Todo not found.',
                    error: {}
                });
            }
            res.render('todos/edit', {
                title: 'Edit Todo',
                todo
            });
        } catch (error) {
            console.error('Error fetching todo:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error fetching todo.',
                error: {}
            });
        }
    },

    async updateTodo(req, res) {
        try {
            await connectDB();
            const { title, description, priority, category, dueDate, tags } = req.body;
            
            await Todo.findByIdAndUpdate(req.params.id, {
                title,
                description,
                priority,
                category,
                dueDate: dueDate || null,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : []
            });

            res.redirect('/todos');
        } catch (error) {
            console.error('Error updating todo:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error updating todo.',
                error: {}
            });
        }
    },

    async deleteTodo(req, res) {
        try {
            await connectDB();
            await Todo.findByIdAndDelete(req.params.id);
            res.redirect('/todos');
        } catch (error) {
            console.error('Error deleting todo:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error deleting todo.',
                error: {}
            });
        }
    },

    async toggleComplete(req, res) {
        try {
            await connectDB();
            const todo = await Todo.findById(req.params.id);
            if (!todo) {
                return res.status(404).json({ error: 'Todo not found' });
            }
            
            todo.completed = !todo.completed;
            if (todo.completed) {
                todo.completedAt = new Date();
            } else {
                todo.completedAt = null;
            }
            
            await todo.save();
            res.json({ success: true, completed: todo.completed });
        } catch (error) {
            console.error('Error toggling todo:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

// Routes
app.get('/', (req, res) => {
    res.redirect('/todos');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: {
            connected: isConnected,
            uri: MONGODB_URI ? 'configured' : 'not configured'
        },
        timestamp: new Date().toISOString()
    });
});

// Todo routes
app.get('/todos', todoController.getAllTodos);

app.get('/todos/new', (req, res) => {
    res.render('todos/create', {
        title: 'Create New Todo'
    });
});

app.post('/todos', todoController.createTodo);

app.get('/todos/:id/edit', todoController.showEditForm);

app.put('/todos/:id', todoController.updateTodo);

app.delete('/todos/:id', todoController.deleteTodo);

app.post('/todos/:id/toggle', todoController.toggleComplete);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error',
        message: 'Something went wrong!',
        error: {}
    });
});

app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        error: {}
    });
});

// Export for Vercel
module.exports = app;

// For local testing
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
