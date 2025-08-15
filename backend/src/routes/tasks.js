const express = require('express');
const { runQuery, getRow, getAll } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(authenticateToken);

// Get all tasks for the authenticated user
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const userId = req.user.userId;

        let sql = 'SELECT * FROM tasks WHERE user_id = $1';
        let params = [userId];

        // Filter by status if provided
        if (status && ['To Do', 'In Progress', 'Done'].includes(status)) {
            sql += ' AND status = $2';
            params.push(status);
        }

        sql += ' ORDER BY created_at DESC';

        const tasks = await getAll(sql, params);

        res.json({
            success: true,
            data: tasks
        });

    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get a single task by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const task = await getRow(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create a new task
router.post('/', async (req, res) => {
    try {
        const { title, description, status = 'To Do', deadline, reminder_time } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        if (status && !['To Do', 'In Progress', 'Done'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: To Do, In Progress, Done'
            });
        }

        const result = await runQuery(
            'INSERT INTO tasks (title, description, status, deadline, reminder_time, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title.trim(), description?.trim() || '', status, deadline || null, reminder_time || null, userId]
        );

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: result
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update a task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, deadline, reminder_time } = req.body;
        const userId = req.user.userId;

        // Check if task exists and belongs to user
        const existingTask = await getRow(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Validation
        if (title !== undefined && title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title cannot be empty'
            });
        }

        if (status && !['To Do', 'In Progress', 'Done'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: To Do, In Progress, Done'
            });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramCount++}`);
            params.push(title.trim());
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            params.push(description?.trim() || '');
        }

        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            params.push(status);
        }

        if (deadline !== undefined) {
            updates.push(`deadline = $${paramCount++}`);
            params.push(deadline);
        }

        if (reminder_time !== undefined) {
            updates.push(`reminder_time = $${paramCount++}`);
            params.push(reminder_time);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id, userId);

        const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++}`;
        await runQuery(sql, params);

        // Get the updated task
        const updatedTask = await getRow('SELECT * FROM tasks WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask
        });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Check if task exists and belongs to user
        const existingTask = await getRow(
            'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        await runQuery('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
