const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const todoController = require('../controllers/todoController');

// Validation rules
const todoValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category cannot exceed 50 characters'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date')
];

// GET /todos - Display all todos
router.get('/', todoController.getAllTodos);

// GET /todos/search - Search todos
router.get('/search', todoController.searchTodos);

// GET /todos/new - Show create todo form
router.get('/new', todoController.renderCreateForm);

// POST /todos - Create new todo
router.post('/', todoValidation, todoController.createTodo);

// GET /todos/:id - Get single todo (API)
router.get('/:id/api', todoController.getTodo);

// GET /todos/:id/edit - Show edit todo form
router.get('/:id/edit', todoController.renderEditForm);

// PUT /todos/:id - Update todo
router.put('/:id', todoValidation, todoController.updateTodo);

// PATCH /todos/:id/toggle - Toggle completion status
router.patch('/:id/toggle', todoController.toggleComplete);

// DELETE /todos/:id - Delete todo
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
