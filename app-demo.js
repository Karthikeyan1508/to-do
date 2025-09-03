const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for demo purposes (replace with MongoDB in production)
let todos = [
    {
        _id: '1',
        title: 'Complete the todo application',
        description: 'Finish building the professional todo app with all features',
        completed: false,
        priority: 'high',
        category: 'Work',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ['development', 'urgent'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: '2',
        title: 'Review documentation',
        description: 'Go through the README and make sure everything is accurate',
        completed: true,
        priority: 'medium',
        category: 'Documentation',
        dueDate: null,
        tags: ['review'],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(),
        completedAt: new Date()
    },
    {
        _id: '3',
        title: 'Setup MongoDB connection',
        description: 'Configure MongoDB Atlas or local MongoDB instance',
        completed: false,
        priority: 'high',
        category: 'Setup',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        tags: ['database', 'configuration'],
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date()
    },
    {
        _id: '4',
        title: 'Test application features',
        description: 'Test all CRUD operations and filtering functionality',
        completed: false,
        priority: 'medium',
        category: 'Testing',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue
        tags: ['testing', 'qa'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date()
    }
];

let nextId = 5;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make req available to templates for query parameters
app.use((req, res, next) => {
    res.locals.req = req;
    next();
});

// Helper functions for in-memory data
function addVirtualFields(todo) {
    // Add virtual fields like in Mongoose model
    todo.formattedCreatedAt = todo.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    todo.formattedDueDate = todo.dueDate ? todo.dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : null;
    
    todo.isOverdue = todo.dueDate && !todo.completed && todo.dueDate < new Date();
    
    return todo;
}

function getStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = todos.filter(t => !t.completed).length;
    const overdue = todos.filter(t => !t.completed && t.dueDate && t.dueDate < new Date()).length;
    
    return {
        total,
        completed,
        pending,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
}

// Routes
app.get('/', (req, res) => {
    res.redirect('/todos');
});

// Get all todos with filtering and sorting
app.get('/todos', (req, res) => {
    try {
        const { filter, sort, category, priority } = req.query;
        let filteredTodos = [...todos];

        // Apply filters
        if (filter === 'completed') {
            filteredTodos = filteredTodos.filter(t => t.completed);
        } else if (filter === 'pending') {
            filteredTodos = filteredTodos.filter(t => !t.completed);
        } else if (filter === 'overdue') {
            filteredTodos = filteredTodos.filter(t => !t.completed && t.dueDate && t.dueDate < new Date());
        }

        if (category && category !== 'all') {
            filteredTodos = filteredTodos.filter(t => t.category === category);
        }

        if (priority && priority !== 'all') {
            filteredTodos = filteredTodos.filter(t => t.priority === priority);
        }

        // Apply sorting
        switch (sort) {
            case 'dueDate':
                filteredTodos.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return a.dueDate - b.dueDate;
                });
                break;
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                filteredTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'alphabetical':
                filteredTodos.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                filteredTodos.sort((a, b) => b.createdAt - a.createdAt);
        }

        // Add virtual fields
        filteredTodos = filteredTodos.map(addVirtualFields);

        const stats = getStats();
        const categories = [...new Set(todos.map(t => t.category))];

        res.render('todos/index', {
            title: 'Todo Manager',
            todos: filteredTodos,
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
            message: 'Error fetching todos',
            error: error
        });
    }
});

// Search todos
app.get('/todos/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.redirect('/todos');
        }

        const searchTodos = todos.filter(todo => 
            todo.title.toLowerCase().includes(q.toLowerCase()) ||
            todo.description.toLowerCase().includes(q.toLowerCase()) ||
            todo.category.toLowerCase().includes(q.toLowerCase()) ||
            (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase())))
        ).map(addVirtualFields);

        const stats = getStats();
        const categories = [...new Set(todos.map(t => t.category))];

        res.render('todos/index', {
            title: `Search Results for "${q}"`,
            todos: searchTodos,
            stats,
            categories,
            currentFilter: 'all',
            currentSort: 'newest',
            currentCategory: 'all',
            currentPriority: 'all',
            searchQuery: q
        });
    } catch (error) {
        console.error('Error searching todos:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error searching todos',
            error: error
        });
    }
});

// Show create form
app.get('/todos/new', (req, res) => {
    res.render('todos/create', {
        title: 'Create New Todo',
        todo: {},
        errors: []
    });
});

// Create todo
app.post('/todos', (req, res) => {
    try {
        const todoData = {
            _id: String(nextId++),
            title: req.body.title,
            description: req.body.description || '',
            priority: req.body.priority || 'medium',
            category: req.body.category || 'General',
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };

        todos.push(todoData);
        res.redirect('/todos?message=Todo created successfully');
    } catch (error) {
        console.error('Error creating todo:', error);
        res.render('todos/create', {
            title: 'Create New Todo',
            todo: req.body,
            errors: [{ msg: 'Error creating todo: ' + error.message }]
        });
    }
});

// Show edit form
app.get('/todos/:id/edit', (req, res) => {
    try {
        const todo = todos.find(t => t._id === req.params.id);
        if (!todo) {
            return res.status(404).render('error', {
                title: 'Todo Not Found',
                message: 'The todo you are looking for does not exist.',
                error: {}
            });
        }

        // Format due date for input field
        if (todo.dueDate) {
            todo.dueDateFormatted = todo.dueDate.toISOString().split('T')[0];
        }

        res.render('todos/edit', {
            title: 'Edit Todo',
            todo,
            errors: []
        });
    } catch (error) {
        console.error('Error fetching todo for edit:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error fetching todo',
            error: error
        });
    }
});

// Update todo
app.put('/todos/:id', (req, res) => {
    try {
        const todoIndex = todos.findIndex(t => t._id === req.params.id);
        if (todoIndex === -1) {
            return res.status(404).render('error', {
                title: 'Todo Not Found',
                message: 'The todo you are looking for does not exist.',
                error: {}
            });
        }

        const todo = todos[todoIndex];
        todo.title = req.body.title;
        todo.description = req.body.description || '';
        todo.priority = req.body.priority || 'medium';
        todo.category = req.body.category || 'General';
        todo.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
        todo.tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        todo.updatedAt = new Date();

        res.redirect('/todos?message=Todo updated successfully');
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error updating todo',
            error: error
        });
    }
});

// Toggle completion
app.patch('/todos/:id/toggle', (req, res) => {
    try {
        const todo = todos.find(t => t._id === req.params.id);
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        todo.completed = !todo.completed;
        todo.updatedAt = new Date();
        
        if (todo.completed) {
            todo.completedAt = new Date();
        } else {
            delete todo.completedAt;
        }

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.json({ 
                success: true, 
                completed: todo.completed,
                message: todo.completed ? 'Todo marked as completed' : 'Todo marked as pending'
            });
        } else {
            res.redirect('/todos');
        }
    } catch (error) {
        console.error('Error toggling todo completion:', error);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(500).json({ error: 'Error updating todo' });
        } else {
            res.redirect('/todos?error=Error updating todo');
        }
    }
});

// Delete todo
app.delete('/todos/:id', (req, res) => {
    try {
        const todoIndex = todos.findIndex(t => t._id === req.params.id);
        if (todoIndex === -1) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        todos.splice(todoIndex, 1);

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.json({ success: true, message: 'Todo deleted successfully' });
        } else {
            res.redirect('/todos?message=Todo deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(500).json({ error: 'Error deleting todo' });
        } else {
            res.redirect('/todos?error=Error deleting todo');
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        error: {}
    });
});

app.listen(PORT, () => {
    console.log(`✅ Todo App is running on http://localhost:${PORT}`);
    console.log(`📝 Demo Mode: Using in-memory storage (replace with MongoDB for production)`);
    console.log(`🎯 Features: CRUD operations, filtering, sorting, search`);
});
