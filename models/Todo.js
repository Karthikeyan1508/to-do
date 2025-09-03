const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Todo title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Category cannot exceed 50 characters'],
        default: 'General'
    },
    dueDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

// Update the updatedAt field before saving
todoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.completed && !this.completedAt) {
        this.completedAt = Date.now();
    } else if (!this.completed) {
        this.completedAt = undefined;
    }
    next();
});

// Virtual for formatting created date
todoSchema.virtual('formattedCreatedAt').get(function() {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Virtual for formatting due date
todoSchema.virtual('formattedDueDate').get(function() {
    if (!this.dueDate) return null;
    return this.dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

// Virtual for checking if todo is overdue
todoSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate || this.completed) return false;
    return this.dueDate < new Date();
});

// Instance method to toggle completion
todoSchema.methods.toggleComplete = function() {
    this.completed = !this.completed;
    if (this.completed) {
        this.completedAt = Date.now();
    } else {
        this.completedAt = undefined;
    }
    return this.save();
};

// Static method to get todos by priority
todoSchema.statics.getByPriority = function(priority) {
    return this.find({ priority: priority }).sort({ createdAt: -1 });
};

// Static method to get completed todos
todoSchema.statics.getCompleted = function() {
    return this.find({ completed: true }).sort({ completedAt: -1 });
};

// Static method to get pending todos
todoSchema.statics.getPending = function() {
    return this.find({ completed: false }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Todo', todoSchema);
