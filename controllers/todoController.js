const Todo = require('../models/Todo');
const { validationResult } = require('express-validator');

const todoController = {
    // Get all todos with filtering and sorting options
    async getAllTodos(req, res) {
        try {
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
                case 'dueDate':
                    sortOptions = { dueDate: 1, createdAt: -1 };
                    break;
                case 'priority':
                    sortOptions = { 
                        priority: 1, // This will need custom sorting
                        createdAt: -1 
                    };
                    break;
                case 'alphabetical':
                    sortOptions = { title: 1 };
                    break;
                default:
                    sortOptions = { createdAt: -1 };
            }

            let todos = await Todo.find(query).sort(sortOptions);

            // Custom priority sorting (high, medium, low)
            if (sort === 'priority') {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                todos = todos.sort((a, b) => {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                });
            }

            // Get statistics
            const stats = await todoController.getStats();

            // Get unique categories for filter dropdown
            const categories = await Todo.distinct('category');

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
            console.error('Error message:', error.message);
            console.error('MongoDB connection state:', require('mongoose').connection.readyState);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Error fetching todos. Database connection issue.',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    },

    // Get statistics for dashboard
    async getStats() {
        try {
            const total = await Todo.countDocuments();
            const completed = await Todo.countDocuments({ completed: true });
            const pending = await Todo.countDocuments({ completed: false });
            const overdue = await Todo.countDocuments({
                completed: false,
                dueDate: { $lt: new Date() }
            });

            return {
                total,
                completed,
                pending,
                overdue,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { total: 0, completed: 0, pending: 0, overdue: 0, completionRate: 0 };
        }
    },

    // Show create todo form
    renderCreateForm(req, res) {
        res.render('todos/create', {
            title: 'Create New Todo',
            todo: {},
            errors: []
        });
    },

    // Create new todo
    async createTodo(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('todos/create', {
                    title: 'Create New Todo',
                    todo: req.body,
                    errors: errors.array()
                });
            }

            const todoData = {
                title: req.body.title,
                description: req.body.description || '',
                priority: req.body.priority || 'medium',
                category: req.body.category || 'General',
                dueDate: req.body.dueDate || null
            };

            // Handle tags
            if (req.body.tags) {
                todoData.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            const todo = new Todo(todoData);
            await todo.save();

            res.redirect('/todos?message=Todo created successfully');
        } catch (error) {
            console.error('Error creating todo:', error);
            res.render('todos/create', {
                title: 'Create New Todo',
                todo: req.body,
                errors: [{ msg: 'Error creating todo: ' + error.message }]
            });
        }
    },

    // Show edit todo form
    async renderEditForm(req, res) {
        try {
            const todo = await Todo.findById(req.params.id);
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
    },

    // Update todo
    async updateTodo(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const todo = await Todo.findById(req.params.id);
                if (todo.dueDate) {
                    todo.dueDateFormatted = todo.dueDate.toISOString().split('T')[0];
                }
                return res.render('todos/edit', {
                    title: 'Edit Todo',
                    todo: { ...todo.toObject(), ...req.body },
                    errors: errors.array()
                });
            }

            const updateData = {
                title: req.body.title,
                description: req.body.description || '',
                priority: req.body.priority || 'medium',
                category: req.body.category || 'General',
                dueDate: req.body.dueDate || null
            };

            // Handle tags
            if (req.body.tags) {
                updateData.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else {
                updateData.tags = [];
            }

            await Todo.findByIdAndUpdate(req.params.id, updateData);
            res.redirect('/todos?message=Todo updated successfully');
        } catch (error) {
            console.error('Error updating todo:', error);
            const todo = await Todo.findById(req.params.id);
            res.render('todos/edit', {
                title: 'Edit Todo',
                todo: { ...todo.toObject(), ...req.body },
                errors: [{ msg: 'Error updating todo: ' + error.message }]
            });
        }
    },

    // Toggle todo completion status
    async toggleComplete(req, res) {
        try {
            const todo = await Todo.findById(req.params.id);
            if (!todo) {
                return res.status(404).json({ error: 'Todo not found' });
            }

            await todo.toggleComplete();
            
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
    },

    // Delete todo
    async deleteTodo(req, res) {
        try {
            const todo = await Todo.findByIdAndDelete(req.params.id);
            if (!todo) {
                return res.status(404).json({ error: 'Todo not found' });
            }

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
    },

    // Get single todo (API endpoint)
    async getTodo(req, res) {
        try {
            const todo = await Todo.findById(req.params.id);
            if (!todo) {
                return res.status(404).json({ error: 'Todo not found' });
            }
            res.json(todo);
        } catch (error) {
            console.error('Error fetching todo:', error);
            res.status(500).json({ error: 'Error fetching todo' });
        }
    },

    // Search todos
    async searchTodos(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.redirect('/todos');
            }

            const todos = await Todo.find({
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { category: { $regex: q, $options: 'i' } },
                    { tags: { $in: [new RegExp(q, 'i')] } }
                ]
            }).sort({ createdAt: -1 });

            const stats = await todoController.getStats();
            const categories = await Todo.distinct('category');

            res.render('todos/index', {
                title: `Search Results for "${q}"`,
                todos,
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
    }
};

module.exports = todoController;
